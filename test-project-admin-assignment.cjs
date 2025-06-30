const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Test Project Admin assignment functionality using curl
async function testProjectAdminAssignment() {
    try {
        console.log('Testing Project Admin assignment functionality...');
        
        // Step 1: Login as admin@pbms.com (project creator)
        console.log('\n1. Logging in as admin@pbms.com...');
        const loginCmd = `curl -s -X POST http://localhost:3001/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@pbms.com","password":"password"}'`;
        
        const { stdout: loginResult } = await execPromise(loginCmd);
        const loginData = JSON.parse(loginResult);
        
        if (!loginData.token) {
            throw new Error('Failed to login: ' + loginResult);
        }
        
        const token = loginData.token;
        console.log('✓ Successfully logged in as admin@pbms.com');
        
        // Step 2: Create a new project
        console.log('\n2. Creating new project...');
        const projectData = {
            name: 'Test Project Admin Assignment',
            description: 'Testing that selected Project Admin gets admin role',
            total_budget: 5000,
            currency: 'USD',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            department: 'IT',
            business_unit_id: '2531935e-e569-462e-a74e-23a9fa02f561'
        };
        
        const createProjectCmd = `curl -s -X POST http://localhost:3001/api/projects \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d '${JSON.stringify(projectData)}'`;
        
        const { stdout: projectResult } = await execPromise(createProjectCmd);
        const projectData_result = JSON.parse(projectResult);
        
        if (!projectData_result.project) {
            throw new Error('Failed to create project: ' + projectResult);
        }
        
        const projectId = projectData_result.project.id;
        console.log('✓ Created project:', projectData_result.project.name);
        console.log('  Project ID:', projectId);
        
        // Step 3: Add team members with explicit roles
        console.log('\n3. Adding team members...');
        
        // Add manager@pbms.com as Project Admin (admin role)
        const addAdminCmd = `curl -s -X POST http://localhost:3001/api/project-teams \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d '{"project_id":"${projectId}","user_id":"9dad9102-0dc0-4c88-abcd-3ed0d68f9380","role":"admin"}'`;
        
        await execPromise(addAdminCmd);
        console.log('✓ Added manager@pbms.com as Project Admin (admin role)');
        
        // Add user@pbms.com as team member
        const addMemberCmd = `curl -s -X POST http://localhost:3001/api/project-teams \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d '{"project_id":"${projectId}","user_id":"18c8cc72-99d1-4dc1-999e-e9fc75b035b7","role":"member"}'`;
        
        await execPromise(addMemberCmd);
        console.log('✓ Added user@pbms.com as team member');
        
        // Step 4: Verify role assignments
        console.log('\n4. Verifying role assignments...');
        const queryCmd = `psql -h localhost -p 5432 -U postgres -d pbms_db_new -c "SELECT p.name as project_name, pt.user_id, u.email, pt.role FROM projects p JOIN project_teams pt ON p.id = pt.project_id JOIN users u ON pt.user_id = u.id WHERE p.name = 'Test Project Admin Assignment' ORDER BY pt.role;"`;
        
        const { stdout: queryResult } = await execPromise(queryCmd);
        console.log('\n=== Project Team Roles ===');
        console.log(queryResult);
        
        // Check if the assignments are correct
        const hasCorrectAdmin = queryResult.includes('manager@pbms.com') && queryResult.includes('admin');
        const hasCorrectMember = queryResult.includes('user@pbms.com') && queryResult.includes('member');
        const noAutoAssignment = !queryResult.includes('admin@pbms.com'); // Project creator should NOT be auto-assigned
        
        if (hasCorrectAdmin && hasCorrectMember && noAutoAssignment) {
            console.log('\n✅ SUCCESS: Project Admin assignment working correctly!');
            console.log('   ✓ Selected Project Admin (manager@pbms.com) has admin role');
            console.log('   ✓ Team member (user@pbms.com) has member role');
            console.log('   ✓ Project creator (admin@pbms.com) is NOT automatically assigned');
        } else {
            console.log('\n❌ ISSUES DETECTED:');
            if (!hasCorrectAdmin) console.log('   ✗ Project Admin role assignment failed');
            if (!hasCorrectMember) console.log('   ✗ Team member role assignment failed');
            if (!noAutoAssignment) console.log('   ✗ Project creator was automatically assigned (should not happen)');
        }
        
        // Clean up - delete the test project
        console.log('\n5. Cleaning up test project...');
        const deleteCmd = `curl -s -X DELETE http://localhost:3001/api/projects/${projectId} \
            -H "Authorization: Bearer ${token}"`;
        
        await execPromise(deleteCmd);
        console.log('✓ Test project deleted');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stdout) console.error('STDOUT:', error.stdout);
        if (error.stderr) console.error('STDERR:', error.stderr);
    }
}

testProjectAdminAssignment();