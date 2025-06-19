// Using built-in fetch (Node.js 18+)

async function testExpensesAPI() {
  try {
    // First, login to get a token
    console.log('🔐 Attempting login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ad@gmail.com', password: 'password123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('❌ No token received from login');
      return;
    }
    
    // Now fetch expenses
    console.log('📊 Fetching expenses...');
    const expensesResponse = await fetch('http://localhost:3001/api/expenses', {
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Expenses response status:', expensesResponse.status);
    const expensesData = await expensesResponse.json();
    console.log('Expenses data:', expensesData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExpensesAPI();