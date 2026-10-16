import { UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { QueryError } from "../../components/ui/QueryError";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useResendInvite, useTeam, useUpdateTeamMemberRole, useUpdateTeamMemberStatus } from "../../hooks/useTeam";
import { errorMessage } from "../../lib/api";
import { formatDate, relativeTime } from "../../lib/formatters";
import { can } from "../../lib/permissions";
import { AddMemberDialog, InviteLinkPanel } from "./AddMemberDialog";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { roleLabel } from "./roles";
import { TeamRowMenu } from "./TeamRowMenu";

function memberStatus(member) {
  if (member.status === "disabled") return "disabled";
  return member.invitePending ? "invited" : "active";
}

export function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: members = [], isLoading, isError, refetch } = useTeam();
  const canManageTeam = can(user, "team.manage");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [roleDialogMember, setRoleDialogMember] = useState(null);
  const [statusDialogMember, setStatusDialogMember] = useState(null);
  const [resentInvite, setResentInvite] = useState(null);

  const updateRoleMutation = useUpdateTeamMemberRole();
  const updateStatusMutation = useUpdateTeamMemberStatus();
  const resendInviteMutation = useResendInvite();

  function handleChangeRole(id, role) {
    updateRoleMutation.mutate(
      { id, role },
      {
        onSuccess: (member) => {
          toast.success(`${member.name} is now ${roleLabel(member.role)}.`);
          setRoleDialogMember(null);
        },
      }
    );
  }

  function handleToggleStatus() {
    const member = statusDialogMember;
    const status = member.status === "active" ? "disabled" : "active";
    updateStatusMutation.mutate(
      { id: member._id, status },
      {
        onSuccess: (updated) => {
          toast.success(
            status === "disabled"
              ? `${updated.name} was disabled and signed out everywhere.`
              : `${updated.name} can sign in again.`
          );
          setStatusDialogMember(null);
        },
        onError: (error) => {
          toast.error(errorMessage(error, "Couldn't change that member's status."));
          setStatusDialogMember(null);
        },
      }
    );
  }

  function handleResendInvite(member) {
    resendInviteMutation.mutate(member._id, {
      onSuccess: (result) => setResentInvite(result),
      onError: (error) => toast.error(errorMessage(error, "Couldn't create a new invitation.")),
    });
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (member) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={member.name} size={24} />
          <span className="text-text-primary">
            {member.name}
            {member._id === user.id && <span className="text-text-secondary"> (you)</span>}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (member) => <span className="font-data text-text-secondary">{member.email}</span>,
    },
    {
      key: "role",
      label: "Role",
      render: (member) => (
        <span className="inline-block whitespace-nowrap rounded-btn border border-border px-2 py-0.5 text-[12px] text-text-secondary">
          {roleLabel(member.role)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (member) => <StatusBadge status={memberStatus(member)} />,
    },
    {
      key: "lastLoginAt",
      label: "Last sign-in",
      render: (member) =>
        member.lastLoginAt ? (
          <span className="font-data">{relativeTime(member.lastLoginAt)}</span>
        ) : (
          <span className="font-data text-text-secondary">Never</span>
        ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (member) => <span className="font-data">{formatDate(member.createdAt)}</span>,
    },
    ...(canManageTeam
      ? [
          {
            key: "actions",
            label: "",
            align: "right",
            render: (member) =>
              member._id === user.id ? null : (
                <div className="flex justify-end">
                  <TeamRowMenu
                    member={member}
                    onChangeRole={() => setRoleDialogMember(member)}
                    onToggleStatus={() => setStatusDialogMember(member)}
                    onResendInvite={() => handleResendInvite(member)}
                  />
                </div>
              ),
          },
        ]
      : []),
  ];

  const isDisabling = statusDialogMember?.status === "active";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary">Team</h2>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            <span className="font-data">{members.length}</span> members. Changing a role or disabling an account signs
            that person out immediately.
          </p>
        </div>
        {canManageTeam && (
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <UserPlus size={14} />
            Add member
          </Button>
        )}
      </div>

      <Card padded={false}>
        {isError ? (
          <QueryError message="Couldn't load the team." onRetry={refetch} />
        ) : (
          <DataTable
            columns={columns}
            data={members}
            getRowKey={(member) => member._id}
            isLoading={isLoading}
            skeletonRowCount={6}
            emptyState={
              <div className="flex flex-col items-center gap-3">
                <Users size={28} className="text-text-secondary" />
                <p className="text-[13px] text-text-secondary">No team members yet</p>
              </div>
            }
          />
        )}
      </Card>

      {canManageTeam && (
        <>
          <AddMemberDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} />

          <ChangeRoleDialog
            member={roleDialogMember}
            onClose={() => {
              setRoleDialogMember(null);
              updateRoleMutation.reset();
            }}
            onSubmit={handleChangeRole}
            isSubmitting={updateRoleMutation.isPending}
            error={updateRoleMutation.isError ? errorMessage(updateRoleMutation.error) : ""}
          />

          <ConfirmDialog
            open={statusDialogMember !== null}
            onClose={() => setStatusDialogMember(null)}
            title={isDisabling ? "Disable account" : "Enable account"}
            footer={
              <>
                <Button variant="secondary" onClick={() => setStatusDialogMember(null)}>
                  Cancel
                </Button>
                <Button
                  variant={isDisabling ? "secondary" : "primary"}
                  tone={isDisabling ? "danger" : "default"}
                  onClick={handleToggleStatus}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "Saving…" : isDisabling ? "Disable" : "Enable"}
                </Button>
              </>
            }
          >
            {statusDialogMember &&
              (isDisabling ? (
                <p>
                  <span className="font-medium text-text-primary">{statusDialogMember.name}</span> will be signed out
                  everywhere right away and won't be able to sign in until re-enabled.
                </p>
              ) : (
                <p>
                  <span className="font-medium text-text-primary">{statusDialogMember.name}</span> will be able to sign
                  in again with their existing password.
                </p>
              ))}
          </ConfirmDialog>

          <ConfirmDialog
            open={resentInvite !== null}
            onClose={() => setResentInvite(null)}
            title="New invitation link"
            footer={
              <Button variant="primary" onClick={() => setResentInvite(null)}>
                Done
              </Button>
            }
          >
            {resentInvite && <InviteLinkPanel invite={resentInvite} />}
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
