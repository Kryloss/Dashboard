// Simple database test script for browser console
// Go to http://localhost:3002/workout, open browser console, paste this, and run testDB()

async function testDB() {
    console.log('🔍 Testing database connection and tables...');

    try {
        // Get the Supabase client from the page (assuming it's available globally)
        if (typeof window !== 'undefined' && window.supabase) {
            var supabase = window.supabase;
        } else {
            console.log('❌ Supabase client not found. Make sure you\'re on the workout page.');
            return;
        }

        // Test 1: Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.log('❌ Auth error:', authError.message);
            return;
        }
        if (!user) {
            console.log('❌ No user found. Please sign in first.');
            return;
        }
        console.log('✅ User authenticated:', user.email);

        // Test 2: Check user_profiles table
        console.log('🔍 Testing user_profiles table...');
        const { data: profileTest, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (profileError) {
            console.log('❌ user_profiles table error:', profileError.message);
            if (profileError.message.includes('does not exist')) {
                console.log('💡 Run the user-profiles-goals-update.sql file in Supabase');
            }
            return;
        }
        console.log('✅ user_profiles table accessible');

        // Test 3: Check user_goals table
        console.log('🔍 Testing user_goals table...');
        const { data: goalsTest, error: goalsError } = await supabase
            .from('user_goals')
            .select('*')
            .limit(1);

        if (goalsError) {
            console.log('❌ user_goals table error:', goalsError.message);
            if (goalsError.message.includes('does not exist')) {
                console.log('💡 Run the user-profiles-goals-update.sql file in Supabase');
            }
            return;
        }
        console.log('✅ user_goals table accessible');

        // Test 4: Try a simple insert/upsert
        console.log('🔍 Testing insert permissions...');
        const testProfile = {
            user_id: user.id,
            weight: 70.0,
            age: 25,
            height: 175.0,
            weight_unit: 'kg',
            height_unit: 'cm'
        };

        const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert(testProfile, { onConflict: 'user_id' });

        if (insertError) {
            console.log('❌ Insert error:', insertError.message);
            return;
        }
        console.log('✅ Insert/upsert working correctly');

        // Test 5: Try loading the data back
        console.log('🔍 Testing data retrieval...');
        const { data: loadedProfile, error: loadError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (loadError) {
            console.log('❌ Load error:', loadError.message);
            return;
        }
        console.log('✅ Data retrieval working');
        console.log('📊 Loaded profile:', loadedProfile);

        console.log('🎉 All tests passed! The save buttons should work now.');

    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

console.log('✨ Database test loaded! Run testDB() to test your database setup.');
console.log('📝 Make sure to run user-profiles-goals-update.sql in Supabase first if you get table errors.');