"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { api } from "../../../convex/_generated/api"

export function AccountSettings() {
  const deleteUserData = useMutation(api.users.deleteUserData)
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const onConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteUserData({})
      await authClient.signOut()
      window.location.href = "/login"
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete account"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#0F172A]">Delete Account</h3>
      <p className="text-sm text-[#64748B]">
        This action is irreversible and will permanently delete all your data.
      </p>
      <Button
        type="button"
        variant="outline"
        className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        Delete My Account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Account"
        description="Are you sure? This cannot be undone."
        confirmLabel="Delete Account"
        confirmVariant="destructive"
        onConfirm={onConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
