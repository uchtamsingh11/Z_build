import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // First create the 'profiles' storage bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json(
        { error: 'Error listing storage buckets', details: bucketsError },
        { status: 500 }
      );
    }
    
    // Check if profiles bucket exists
    const profilesBucket = buckets?.find(bucket => bucket.name === 'profiles');
    
    if (!profilesBucket) {
      // Create the profiles bucket
      const { data, error } = await supabase.storage.createBucket('profiles', {
        public: true, // Make files publicly accessible
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
      });
      
      if (error) {
        return NextResponse.json(
          { error: 'Error creating profiles bucket', details: error },
          { status: 500 }
        );
      }
      
      // Create a unified policy for all operations on profiles bucket
      try {
        const createPolicyQuery = `
          CREATE POLICY "profiles_bucket_policy" ON storage.objects
          FOR ALL
          TO public
          USING (bucket_id = 'profiles')
          WITH CHECK (bucket_id = 'profiles');
        `;
        
        const { error: policyError } = await supabase.rpc('execute_sql', {
          sql: createPolicyQuery
        });
        
        if (policyError) {
          console.error('Error creating bucket policy:', policyError);
        }
      } catch (policyErr) {
        console.error('Exception creating bucket policy:', policyErr);
      }
    }
    
    // Check if phone column exists
    const { data: phoneColumnData, error: phoneColumnError } = await supabase
      .from('users')
      .select('phone')
      .limit(1);
    
    // If error is because column doesn't exist, add it
    if (phoneColumnError && phoneColumnError.message.includes('phone')) {
      // We need to use a stored procedure to execute ALTER TABLE
      // Create a stored procedure to add the column
      const addPhoneColumnQuery = `
        BEGIN;
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
        COMMIT;
      `;
      
      const { error: addPhoneError } = await supabase.rpc('execute_sql', {
        sql: addPhoneColumnQuery
      });
      
      if (addPhoneError) {
        console.error('Error adding phone column:', addPhoneError);
      }
    }
    
    // Check if avatar_url column exists
    const { data: avatarColumnData, error: avatarColumnError } = await supabase
      .from('users')
      .select('avatar_url')
      .limit(1);
    
    // If error is because column doesn't exist, add it
    if (avatarColumnError && avatarColumnError.message.includes('avatar_url')) {
      // Create a stored procedure to add the column
      const addAvatarColumnQuery = `
        BEGIN;
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        COMMIT;
      `;
      
      const { error: addAvatarError } = await supabase.rpc('execute_sql', {
        sql: addAvatarColumnQuery
      });
      
      if (addAvatarError) {
        console.error('Error adding avatar_url column:', addAvatarError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Storage profiles bucket and users table updated successfully'
    });
    
  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json(
      { error: 'Server error', details: error },
      { status: 500 }
    );
  }
} 