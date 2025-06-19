async function testProjectsAPI() {
    try {
        // First login to get token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful, token received');
        
        // Test projects endpoint
        console.log('📋 Fetching projects...');
        const projectsResponse = await fetch('http://localhost:3001/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const projectsData = await projectsResponse.json();
        
        console.log('📊 Projects API Response:');
        console.log('Status:', projectsResponse.status);
        console.log('Data:', JSON.stringify(projectsData, null, 2));
        
        if (projectsData && projectsData.data) {
            console.log(`\n📈 Found ${projectsData.data.length} projects`);
            projectsData.data.forEach((project, index) => {
                console.log(`${index + 1}. ${project.name} (ID: ${project.id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testProjectsAPI();