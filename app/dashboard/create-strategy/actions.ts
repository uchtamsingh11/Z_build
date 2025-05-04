'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createStrategy(formData: FormData) {
  // Get form data
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as string;
  const price = parseFloat(formData.get('price') as string);
  const script_code = formData.get('script_code') as string;
  const userId = formData.get('userId') as string;

  // Validate input
  if (!name || !description || !script_code || isNaN(price)) {
    throw new Error('All fields are required');
  }

  // Create Supabase client
  const supabase = await createClient();

  // Verify user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError || userData?.role !== 'admin') {
    throw new Error('Only admins can create strategies');
  }

  // Insert strategy into database
  const { data, error } = await supabase
    .from('strategies')
    .insert({
      name,
      description,
      script_code,
      price,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving strategy:', error);
    throw new Error(`Failed to create strategy: ${error.message}`);
  }

  // Revalidate marketplace page to show the new strategy
  revalidatePath('/marketplace');
  
  // Redirect to marketplace
  redirect('/marketplace?success=strategy-created');
} 