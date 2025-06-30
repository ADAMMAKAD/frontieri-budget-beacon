// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3001/api';

async function testApiWithAuth() {
    try {
        console.log('🔐 Testing login...');
        
        // Login to get token
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@pbms.com',
                password: 'password' // Correct password from database
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📝 Login response:', loginData);
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed, trying user account...');
            
            // Try with user account
            const userLoginResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'user@pbms.com',
                    password: 'user123'
                })
            });
            
            const userLoginData = await userLoginResponse.json();
            console.log('📝 User login response:', userLoginData);
            
            if (!userLoginResponse.ok) {
                console.log('❌ Both login attempts failed');
                return;
            }
            
            var token = userLoginData.token;
        } else {
            var token = loginData.token;
        }
        
        if (!token) {
            console.log('❌ No token received');
            return;
        }
        
        console.log('✅ Login successful, token received');
        
        // Test projects endpoint
        console.log('\n📊 Testing projects endpoint...');
        const projectsResponse = await fetch(`${API_BASE}/projects`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const projectsData = await projectsResponse.json();
        console.log('📊 Projects response status:', projectsResponse.status);
        console.log('📊 Projects data:', projectsData);
        
        // Test business units endpoint
        console.log('\n🏢 Testing business units endpoint...');
        const businessUnitsResponse = await fetch(`${API_BASE}/business-units`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const businessUnitsData = await businessUnitsResponse.json();
        console.log('🏢 Business units response status:', businessUnitsResponse.status);
        console.log('🏢 Business units data:', businessUnitsData);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testApiWithAuth();