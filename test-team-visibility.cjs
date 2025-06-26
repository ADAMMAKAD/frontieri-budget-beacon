// Using built-in fetch API (Node.js 18+)

async function testTeamMemberVisibility() {
    const baseURL = 'http://localhost:3001';
    
    try {
        // Login as admin
        console.log('🔐 Logging in as admin...');
        const adminLoginResponse = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@pbms.com',
                password: 'password'
            })
        });
        
        const adminLoginData = await adminLoginResponse.json();
        if (!adminLoginData.token) {
            throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
        }
        
        const adminToken = adminLoginData.token;
        const adminUserId = adminLoginData.user.id;
        console.log('✅ Admin login successful, user ID:', adminUserId);
        
        const adminHeaders = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };
        
        // Create a test user
        console.log('\n👤 Creating test user...');
        const testUserEmail = `testuser${Date.now()}@pbms.com`;
        const createUserResponse = await fetch(`${baseURL}/api/admin/users`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
                email: testUserEmail,
                password: 'password',
                role: 'user',
                full_name: 'Test User',
                department: 'Testing'
            })
        });
        
        const createUserData = await createUserResponse.json();
        if (createUserData.error) {
            console.log('❌ Could not create test user:', createUserData.error);
            return;
        }
        
        const testUser = createUserData.user;
        console.log('✅ Test user created:', testUser.email, 'ID:', testUser.id);
        
        // Create a test project
        console.log('\n📝 Creating test project...');
        const projectData = {
            name: 'Team Visibility Test Project',
            description: 'Testing team member project visibility',
            total_budget: 15000,
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            currency: 'USD'
        };
        
        const createResponse = await fetch(`${baseURL}/api/projects`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify(projectData)
        });
        const createData = await createResponse.json();
        
        if (createData.error) {
            throw new Error('Project creation failed: ' + JSON.stringify(createData));
        }
        
        const projectId = createData.project.id;
        console.log('✅ Project created with ID:', projectId);
        
        // Login as test user
        console.log('\n🔐 Logging in as test user...');
        const testUserLoginResponse = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: 'password'
            })
        });
        
        const testUserLoginData = await testUserLoginResponse.json();
        if (!testUserLoginData.token) {
            throw new Error('Test user login failed: ' + JSON.stringify(testUserLoginData));
        }
        
        const testUserHeaders = {
            'Authorization': `Bearer ${testUserLoginData.token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('✅ Test user login successful');
        
        // Check initial project visibility (should be empty)
        console.log('\n🔍 Checking initial project visibility for test user...');
        const initialProjectsResponse = await fetch(`${baseURL}/api/projects`, { 
            headers: testUserHeaders 
        });
        const initialProjectsData = await initialProjectsResponse.json();
        
        const initialVisibleProject = initialProjectsData.projects?.find(p => p.id === projectId);
        if (initialVisibleProject) {
            console.log('❌ Project is visible to test user BEFORE being added to team (unexpected)');
        } else {
            console.log('✅ Project is NOT visible to test user before being added to team (expected)');
            console.log('   Test user can see', initialProjectsData.projects?.length || 0, 'projects initially');
        }
        
        // Add test user to project team
        console.log('\n👥 Adding test user to project team...');
        const addTeamMemberResponse = await fetch(`${baseURL}/api/project-teams`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
                project_id: projectId,
                user_id: testUser.id,
                role: 'member'
            })
        });
        
        const addTeamMemberData = await addTeamMemberResponse.json();
        if (addTeamMemberData.error) {
            throw new Error('Failed to add team member: ' + JSON.stringify(addTeamMemberData));
        }
        
        console.log('✅ Test user added to project team');
        
        // Verify team membership
        console.log('\n👥 Verifying team membership...');
        const teamResponse = await fetch(`${baseURL}/api/project-teams?project_id=${projectId}`, { 
            headers: adminHeaders 
        });
        const teamData = await teamResponse.json();
        const teamMembers = teamData.project_teams || [];
        const testUserInTeam = teamMembers.find(member => member.user_id === testUser.id);
        
        if (testUserInTeam) {
            console.log('✅ Test user confirmed in project team with role:', testUserInTeam.role);
        } else {
            console.log('❌ Test user NOT found in project team!');
            console.log('Team members:', teamMembers.map(m => ({ email: m.email, role: m.role })));
        }
        
        // Check project visibility AFTER adding to team
        console.log('\n🔍 Checking project visibility AFTER adding to team...');
        const finalProjectsResponse = await fetch(`${baseURL}/api/projects`, { 
            headers: testUserHeaders 
        });
        const finalProjectsData = await finalProjectsResponse.json();
        
        const finalVisibleProject = finalProjectsData.projects?.find(p => p.id === projectId);
        if (finalVisibleProject) {
            console.log('✅ SUCCESS: Project is now visible to test user after being added to team!');
            console.log('   Project details:', {
                id: finalVisibleProject.id,
                name: finalVisibleProject.name,
                team_size: finalVisibleProject.team_size
            });
        } else {
            console.log('❌ ISSUE FOUND: Project is still NOT visible to test user after being added to team');
            console.log('   Test user can see', finalProjectsData.projects?.length || 0, 'projects after being added');
            console.log('   Available projects:', finalProjectsData.projects?.map(p => ({ id: p.id, name: p.name })));
            
            // This is the bug we need to fix!
            console.log('\n🐛 BUG CONFIRMED: Team members cannot see projects they are assigned to!');
        }
        
        // Clean up
        console.log('\n🧹 Cleaning up...');
        
        // Delete test project
        const deleteProjectResponse = await fetch(`${baseURL}/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: adminHeaders
        });
        
        if (deleteProjectResponse.ok) {
            console.log('✅ Test project deleted');
        }
        
        // Delete test user
        const deleteUserResponse = await fetch(`${baseURL}/api/admin/users/${testUser.id}`, {
            method: 'DELETE',
            headers: adminHeaders
        });
        
        if (deleteUserResponse.ok) {
            console.log('✅ Test user deleted');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testTeamMemberVisibility();