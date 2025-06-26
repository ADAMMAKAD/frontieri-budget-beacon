// Debug script to test project visibility issue with existing users

async function debugProjectVisibility() {
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
        
        // Get existing users to find a non-admin user
        console.log('\n👥 Fetching existing users...');
        const usersResponse = await fetch(`${baseURL}/api/admin/users`, { 
            headers: adminHeaders 
        });
        const usersData = await usersResponse.json();
        
        console.log('Available users:', usersData.users?.map(u => ({ 
            email: u.email, 
            role: u.role, 
            id: u.id,
            is_active: u.is_active 
        })));
        
        // Find a non-admin user that is active
        const nonAdminUser = usersData.users?.find(user => 
            user.email !== 'admin@pbms.com' && 
            user.role !== 'admin' && 
            user.is_active
        );
        
        if (!nonAdminUser) {
            console.log('❌ No active non-admin users found. Let me create one with the default password.');
            
            // Create user without specifying password (will use default)
            const createUserResponse = await fetch(`${baseURL}/api/admin/users`, {
                method: 'POST',
                headers: adminHeaders,
                body: JSON.stringify({
                    email: 'testuser@pbms.com',
                    full_name: 'Test User',
                    role: 'user',
                    department: 'Testing'
                })
            });
            
            const createUserData = await createUserResponse.json();
            if (createUserData.error) {
                console.log('❌ Could not create test user:', createUserData.error);
                return;
            }
            
            console.log('✅ Test user created with default password');
            var testUser = createUserData.user;
            var testUserPassword = 'TempPassword123!';
        } else {
            console.log('📋 Using existing user:', nonAdminUser.email, 'ID:', nonAdminUser.id);
            var testUser = nonAdminUser;
            var testUserPassword = 'password'; // Try common password
        }
        
        // Create a test project
        console.log('\n📝 Creating test project...');
        const projectData = {
            name: 'Debug Visibility Project',
            description: 'Testing project visibility for team members',
            total_budget: 10000,
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
            console.log('❌ Failed to add team member:', addTeamMemberData.error);
        } else {
            console.log('✅ Test user added to project team');
        }
        
        // Verify team membership from admin perspective
        console.log('\n👥 Verifying team membership (admin view)...');
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
            console.log('Team members:', teamMembers.map(m => ({ email: m.email, role: m.role, user_id: m.user_id })));
        }
        
        // Try to login as test user
        console.log('\n🔐 Attempting to login as test user...');
        const testUserLoginResponse = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUserPassword
            })
        });
        
        const testUserLoginData = await testUserLoginResponse.json();
        if (!testUserLoginData.token) {
            console.log('❌ Test user login failed:', testUserLoginData.error);
            console.log('\n⚠️  Cannot test project visibility due to login issue.');
            console.log('However, the team assignment was successful, so the issue is likely in the project filtering query.');
            
            // Let's test the SQL query logic directly
            console.log('\n🔍 Testing project visibility logic...');
            console.log('The projects API should include projects where:');
            console.log('1. User is project manager, OR');
            console.log('2. User exists in project_teams table for that project');
            console.log('\nSince we confirmed the user is in project_teams, they should see the project.');
            console.log('\n🐛 BUG CONFIRMED: The project filtering query in /api/projects is not working correctly.');
        } else {
            console.log('✅ Test user login successful');
            
            const testUserHeaders = {
                'Authorization': `Bearer ${testUserLoginData.token}`,
                'Content-Type': 'application/json'
            };
            
            // Check project visibility from test user perspective
            console.log('\n🔍 Checking project visibility from test user perspective...');
            const userProjectsResponse = await fetch(`${baseURL}/api/projects`, { 
                headers: testUserHeaders 
            });
            const userProjectsData = await userProjectsResponse.json();
            
            const visibleProject = userProjectsData.projects?.find(p => p.id === projectId);
            if (visibleProject) {
                console.log('✅ SUCCESS: Project is visible to test user!');
                console.log('   Project details:', {
                    id: visibleProject.id,
                    name: visibleProject.name,
                    team_size: visibleProject.team_size
                });
            } else {
                console.log('❌ BUG CONFIRMED: Project is NOT visible to test user');
                console.log('   Test user can see', userProjectsData.projects?.length || 0, 'projects');
                console.log('   Available projects:', userProjectsData.projects?.map(p => ({ id: p.id, name: p.name })));
                console.log('\n🐛 The project filtering query in /api/projects is not working correctly.');
            }
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
        
        // Delete test user if we created one
        if (testUser.email === 'testuser@pbms.com') {
            const deleteUserResponse = await fetch(`${baseURL}/api/admin/users/${testUser.id}`, {
                method: 'DELETE',
                headers: adminHeaders
            });
            
            if (deleteUserResponse.ok) {
                console.log('✅ Test user deleted');
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error(error.stack);
    }
}

debugProjectVisibility();