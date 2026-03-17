import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchMeetings, fetchMeetingById, deleteMeeting } from "./meetings.api";
import { getMeetingColumns } from "./meetings.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import AddUpdateMeeting from "./components/AddUpdateMeeting";
import Button from "../../components/Button";
import { useAuth } from "../../app/authContext";
import { useConfirm } from "../../app/confirmContext";
import MeetingIcon from "../../assets/svg/MeetingIcon";
import toast from "react-hot-toast";
import styles from "./MeetingList.module.css";

export default function MeetingList() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const canManageMeetings = user?.role === "teacher" || user?.role === "admin";
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["meetings", page],
    queryFn: () => fetchMeetings({ page, limit }),
    keepPreviousData: true,
  });

  const meetings = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || {}, [data?.pagination]);

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      toast.success("Meeting deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete meeting");
    },
  });

  const handleEdit = useCallback(async (meeting) => {
    try {
      toast.loading("Loading meeting details...", { id: "fetch-meeting" });
      const meetingData = await fetchMeetingById(meeting._id);
      toast.dismiss("fetch-meeting");
      setSelectedMeeting(meetingData);
      setShowForm(true);
    } catch (error) {
      toast.dismiss("fetch-meeting");
      toast.error(
        error.response?.data?.message || "Failed to fetch meeting details",
      );
    }
  }, []);

  const handleDelete = useCallback(
    async (meeting) => {
      const confirmed = await confirm({
        title: "Delete Meeting",
        message: `Are you sure you want to delete this meeting: ${meeting.title}?`,
        confirmText: "Delete",
        confirmVariant: "danger",
      });

      if (confirmed) {
        deleteMutation.mutate(meeting._id);
      }
    },
    [confirm, deleteMutation],
  );

  const handleCopyLink = useCallback((meeting) => {
    if (meeting.meetingLink) {
      navigator.clipboard.writeText(meeting.meetingLink);
      toast.success("Meeting link copied to clipboard!");
    } else {
      toast.error("No meeting link available");
    }
  }, []);

  const handleJoin = useCallback(
    (meeting) => {
      navigate(`/meetings/join/${meeting._id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () =>
      getMeetingColumns(
        handleEdit,
        handleDelete,
        handleCopyLink,
        handleJoin,
        user?.role,
      ),
    [handleEdit, handleDelete, handleCopyLink, handleJoin],
  );

  const handleAddNew = useCallback(() => {
    setSelectedMeeting(null);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedMeeting(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className={`container-fluid py-4 ${styles.container}`}>
      <div className={`animate-fade-in ${styles.heroBanner}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className={`fw-bold mb-2 ${styles.heroTitle}`}>
              <span className="d-inline-flex align-items-center gap-2">
                <MeetingIcon size={22} color="white" />
                Meetings Management
              </span>
            </h2>
            <p className={`mb-0 ${styles.heroSubtitle}`}>
              Schedule and manage online meetings
            </p>
          </div>
          {canManageMeetings && (
            <Button variant="primary" onClick={handleAddNew}>
              <i className="bi bi-plus-lg"></i> Schedule New Meeting
            </Button>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className={`glass-card animate-slide-in ${styles.contentCard}`}>
            {isLoading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <DataTable
                    columns={columns}
                    data={meetings}
                    emptyStateType="meetings"
                    emptyStateTitle="No Meetings Found"
                    emptyStateMessage="Get started by scheduling your first meeting."
                  />
                </div>
                {pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                    onPageChange={setPage}
                    showInfo={true}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <AddUpdateMeeting
          meetingData={selectedMeeting}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
