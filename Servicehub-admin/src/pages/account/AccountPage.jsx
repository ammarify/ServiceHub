import { useState } from "react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DetailField } from "../../components/ui/DetailField";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useChangePassword, useUpdateProfile } from "../../hooks/useAccount";
import { errorMessage, fieldErrors } from "../../lib/api";
import { humanize } from "../../lib/formatters";
import { validatePassword } from "../../lib/passwordRules";

function ProfileCard() {
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const mutation = useUpdateProfile();

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name is too short");
      return;
    }
    setError("");
    mutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => toast.success("Your name was updated."),
        onError: (err) => setError(fieldErrors(err).name ?? errorMessage(err)),
      }
    );
  }

  return (
    <Card>
      <div className="text-[15px] font-semibold text-text-primary">Profile</div>
      <div className="mt-4 flex items-center gap-3">
        <Avatar name={user.name} size={44} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-text-primary">{user.name}</div>
          <div className="font-data truncate text-[12px] text-text-secondary">{user.email}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3" noValidate>
        <FormField label="Display name" error={error}>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <DetailField label="Email" mono>
            {user.email}
          </DetailField>
          <DetailField label="Role">{humanize(user.role)}</DetailField>
        </div>
        <div>
          <Button type="submit" variant="primary" disabled={mutation.isPending || name.trim() === user.name}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const mutation = useChangePassword();

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = "Enter your current password";
    const problem = validatePassword(form.newPassword);
    if (problem) nextErrors.newPassword = problem;
    else if (form.newPassword === form.currentPassword) nextErrors.newPassword = "Choose a different password";
    if (form.confirm !== form.newPassword) nextErrors.confirm = "Passwords don't match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(
      { currentPassword: form.currentPassword, newPassword: form.newPassword },
      {
        onSuccess: () => {
          setForm({ currentPassword: "", newPassword: "", confirm: "" });
          toast.success("Password changed. Your other devices have been signed out.");
        },
        onError: (err) => {
          const apiErrors = fieldErrors(err);
          if (Object.keys(apiErrors).length > 0) setErrors(apiErrors);
          else toast.error(errorMessage(err));
        },
      }
    );
  }

  return (
    <Card>
      <div className="text-[15px] font-semibold text-text-primary">Password</div>
      <p className="mt-1 text-[13px] text-text-secondary">
        Changing your password signs you out on every other device.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3" noValidate>
        <FormField label="Current password" error={errors.currentPassword}>
          <Input
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={update("currentPassword")}
          />
        </FormField>
        <FormField label="New password" hint="At least 8 characters, with a letter and a number." error={errors.newPassword}>
          <Input type="password" autoComplete="new-password" value={form.newPassword} onChange={update("newPassword")} />
        </FormField>
        <FormField label="Confirm new password" error={errors.confirm}>
          <Input type="password" autoComplete="new-password" value={form.confirm} onChange={update("confirm")} />
        </FormField>
        <div>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SessionsCard() {
  const { logoutEverywhere } = useAuth();
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await logoutEverywhere();
    } catch (err) {
      toast.error(errorMessage(err));
      setIsPending(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <Card>
      <div className="text-[15px] font-semibold text-text-primary">Sessions</div>
      <p className="mt-1 text-[13px] text-text-secondary">
        Lost a device or signed in on a shared computer? Sign out everywhere, including this browser.
      </p>
      <Button variant="secondary" tone="danger" className="mt-4" onClick={() => setIsConfirmOpen(true)}>
        Sign out everywhere
      </Button>

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Sign out everywhere"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" tone="danger" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Signing out…" : "Sign out everywhere"}
            </Button>
          </>
        }
      >
        Every active session, on all devices and browsers, will end immediately. You'll need to sign in
        again here too.
      </ConfirmDialog>
    </Card>
  );
}

export function AccountPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[15px] font-semibold text-text-primary">Your account</h2>
      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
        <ProfileCard />
        <div className="flex flex-col gap-4">
          <PasswordCard />
          <SessionsCard />
        </div>
      </div>
    </div>
  );
}
