// ⚠️ BROWSER CONSOLE ONLY - DO NOT RUN IN SUPABASE SQL EDITOR ⚠️
//
// Instructions:
// 1. Go to http://localhost:3002/workout in your browser
// 2. Open browser console (F12 → Console tab)
// 3. Copy and paste this entire file
// 4. Run: testDatabaseConnection()
//
// Simple database connection test script

// Test function to check if tables exist and user can connect
async function testDatabaseConnection() {
    // This would need to be run in browser with your actual Supabase client
    console.log('Testing database connection...');

    // Example of what to check:
    // 1. Can we connect to Supabase?
    // 2. Do the tables exist?
    // 3. Do we have the right permissions?

    try {
        // Test auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.error('Auth error:', authError);
            return false;
        }
        console.log('✅ User authenticated:', user?.email);

        // Test user_profiles table
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('count(*)')
            .limit(1);

        if (profileError) {
            console.error('❌ user_profiles table error:', profileError);
            console.log('💡 Make sure to run the SQL setup file in Supabase dashboard');
            return false;
        }
        console.log('✅ user_profiles table accessible');

        // Test user_goals table
        const { data: goalsData, error: goalsError } = await supabase
            .from('user_goals')
            .select('count(*)')
            .limit(1);

        if (goalsError) {
            console.error('❌ user_goals table error:', goalsError);
            console.log('💡 Make sure to run the SQL setup file in Supabase dashboard');
            return false;
        }
        console.log('✅ user_goals table accessible');

        // Test insert permission
        const testProfile = {
            user_id: user.id,
            weight: 70,
            age: 25,
            height: 175,
            weight_unit: 'kg',
            height_unit: 'cm'
        };

        const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert(testProfile, { onConflict: 'user_id' });

        if (insertError) {
            console.error('❌ Insert permission error:', insertError);
            return false;
        }
        console.log('✅ Insert/update permissions working');

        return true;
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return false;
    }
}

console.log('Database test function defined. Call testDatabaseConnection() to run the test.');