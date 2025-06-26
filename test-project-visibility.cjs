// Test script to debug project visibility issues
async function testProjectVisibility() {
    const baseURL = 'http://localhost:3001';
    
    try {
        // First, login to get a token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@pbms.com',
                password: 'password'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        
        if (!loginData.token || !loginData.user) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }
        
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log('✅ Login successful, user ID:', userId);
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Create a test project
        console.log('\n📝 Creating test project...');
        const projectData = {
            name: 'Test Visibility Project',
            description: 'Testing project visibility',
            total_budget: 10000,
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            currency: 'USD'
        };
        
        const createResponse = await fetch(`${baseURL}/api/projects`, {
            method: 'POST',
            headers,
            body: JSON.stringify(projectData)
        });
        const createData = await createResponse.json();
        const projectId = createData.project.id;
        console.log('✅ Project created with ID:', projectId);
        console.log('Project manager ID:', createData.project.project_manager_id);
        
        // Check if project creator was added to project_teams
        console.log('\n👥 Checking project team members...');
        const teamResponse = await fetch(`${baseURL}/api/project-teams?project_id=${projectId}`, { headers });
        const teamData = await teamResponse.json();
        console.log('Team members:', teamData);
        
        // Fetch all projects to see if the created project is visible
        console.log('\n📋 Fetching all projects...');
        const projectsResponse = await fetch(`${baseURL}/api/projects`, { headers });
        const projectsData = await projectsResponse.json();
        console.log('Total projects found:', projectsData.projects.length);
        
        const createdProject = projectsData.projects.find(p => p.id === projectId);
        if (createdProject) {
            console.log('✅ Created project is visible in projects list');
            console.log('Project details:', {
                id: createdProject.id,
                name: createdProject.name,
                project_manager_id: createdProject.project_manager_id,
                team_size: createdProject.team_size
            });
        } else {
            console.log('❌ Created project is NOT visible in projects list');
            console.log('Available projects:', projectsData.projects.map(p => ({ id: p.id, name: p.name, manager: p.project_manager_id })));
        }
        
        // Test with a different user
        console.log('\n🔄 Testing with a different user...');
        try {
            const user2Response = await fetch(`${baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                     email: 'user@pbms.com',
                     password: 'user123'
                 })
            });
            
            const user2Data = await user2Response.json();
            const user2Token = user2Data.token;
            const user2Headers = {
                'Authorization': `Bearer ${user2Token}`,
                'Content-Type': 'application/json'
            };
            
            const user2ProjectsResponse = await fetch(`${baseURL}/api/projects`, { headers: user2Headers });
            const user2ProjectsData = await user2ProjectsResponse.json();
            console.log('Projects visible to user2:', user2ProjectsData.projects.length);
            
            const projectVisibleToUser2 = user2ProjectsData.projects.find(p => p.id === projectId);
            if (projectVisibleToUser2) {
                console.log('⚠️  Project is visible to user2 (unexpected)');
            } else {
                console.log('✅ Project is NOT visible to user2 (expected)');
            }
        } catch (user2Error) {
            console.log('⚠️  Could not test with user2:', user2Error.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testProjectVisibility();