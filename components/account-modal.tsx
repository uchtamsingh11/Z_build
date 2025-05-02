"use client"

import { useState, useEffect } from "react"
import { X, Upload } from "lucide-react"
import { createClient } from '@/lib/supabase/client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountModal({
  isOpen,
  onClose,
}: AccountModalProps) {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen])

  async function fetchUserData() {
    try {
      setLoading(true)
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error fetching user:', userError)
        return
      }
      
      setUser(user)
      
      // Try to get user from the users table
      let userData = null
      let usersError = null
      
      try {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        userData = result.data
        usersError = result.error
      } catch (err) {
        console.error('Error querying users table:', err)
      }
      
      // Get auth metadata fallbacks
      const userMetadata = user.user_metadata || {}
      const userEmail = user.email || ''
      const userName = userMetadata.name || userEmail.split('@')[0] || ''
      
      if (!usersError && userData) {
        // Initialize profile data with values from users table or fallbacks
        setProfile({
          full_name: userData.full_name || userName,
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || userMetadata.avatar_url || ''
        })
        
        // Set avatar preview
        if (userData.avatar_url) {
          setPreviewUrl(userData.avatar_url)
        } else if (userMetadata.avatar_url) {
          setPreviewUrl(userMetadata.avatar_url)
        }
      } else {
        // Fallback to auth metadata
        setProfile({
          full_name: userName,
          phone: userMetadata.phone || '',
          avatar_url: userMetadata.avatar_url || ''
        })
        
        if (userMetadata.avatar_url) {
          setPreviewUrl(userMetadata.avatar_url)
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      
      // Create preview URL
      const fileReader = new FileReader()
      fileReader.onload = () => {
        if (typeof fileReader.result === 'string') {
          setPreviewUrl(fileReader.result)
        }
      }
      fileReader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setLoading(true)
      
      let avatarUrl = profile.avatar_url
      
      // Upload avatar if file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `avatars/${user.id}.${fileExt}`
        
        // Direct upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile, {
            upsert: true,
            contentType: avatarFile.type
          })
        
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError)
          setNotification({
            message: 'Error uploading profile picture: ' + uploadError.message,
            type: 'error'
          })
          return
        }
        
        // Only get the public URL if upload was successful
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath)
          
          avatarUrl = publicUrl
        }
      }
      
      // Build update object based on the existing schema
      const updateData: Record<string, any> = {
        id: user.id,
        updated_at: new Date().toISOString()
      }
      
      // Add token_identifier field (required by the schema)
      if (user.email) {
        updateData.token_identifier = user.email
      } else {
        // If for some reason email is missing, use a fallback
        updateData.token_identifier = user.id
      }
      
      // Add fields based on what we found in the users table
      if (profile.full_name) {
        updateData.full_name = profile.full_name
      }
      
      // Add phone field
      updateData.phone = profile.phone || null
      
      // Set avatar_url field
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl
      }
      
      // Add email if not already in the record
      if (user.email) {
        updateData.email = user.email
      }
      
      // Update the users table first
      const { error: updateError } = await supabase
        .from('users')
        .upsert(updateData)
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        setNotification({
          message: 'Error updating profile: ' + updateError.message,
          type: 'error'
        })
        return
      }
      
      // Also update auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: profile.full_name,
          avatar_url: avatarUrl
        }
      })
      
      if (metadataError) {
        console.error('Error updating auth metadata:', metadataError)
      }
      
      setNotification({
        message: 'Profile updated successfully',
        type: 'success'
      })
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setNotification({
        message: 'An error occurred: ' + (error instanceof Error ? error.message : String(error)),
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-zinc-800">
                <AvatarImage 
                  src={previewUrl || profile.avatar_url || '/avatars/default.jpg'} 
                  alt={profile.full_name} 
                />
                <AvatarFallback className="text-lg">
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-1 bg-zinc-800 rounded-full cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-zinc-400">Click the icon to change your profile picture</p>
          </div>
          
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-zinc-400">
              Name
            </label>
            <Input
              id="full_name"
              name="full_name"
              value={profile.full_name}
              onChange={handleInputChange}
              placeholder="Your name"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          
          {/* Phone Field */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-zinc-400">
              Mobile Number
            </label>
            <Input
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleInputChange}
              placeholder="Your phone number (optional)"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          
          {/* Email Field (Non-editable) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-400">
              Email
            </label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-zinc-900/50 border-zinc-800 opacity-70 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500">Email cannot be changed</p>
          </div>
          
          {/* Notification */}
          {notification && (
            <div className={`p-3 rounded-md text-sm ${
              notification.type === 'success' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
            }`}>
              {notification.message}
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 