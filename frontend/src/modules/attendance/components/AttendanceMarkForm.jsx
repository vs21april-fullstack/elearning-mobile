import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormField, TextareaField } from "../../../components/FormField";
import Button from "../../../components/Button";
import styles from "./AttendanceMarkForm.module.css";

const attendanceSchema = yup.object().shape({
  studentId: yup.string().required("Student ID is required"),
  status: yup
    .string()
    .oneOf(["present", "absent", "leave"])
    .required("Status is required"),
  remarks: yup.string().max(500, "Remarks cannot exceed 500 characters"),
});

export default function AttendanceMarkForm({
  initialData,
  onSave,
  onClose,
  isLoading,
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(attendanceSchema),
    defaultValues: {
      studentId: "",
      status: "present",
      remarks: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("studentId", initialData.studentId || "");
      setValue("status", initialData.status || "present");
      setValue("remarks", initialData.remarks || "");
    }
  }, [initialData, setValue]);

  const onSubmit = async (data) => {
    try {
      await onSave(data);
      reset();
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3">
          {initialData ? "Update Attendance" : "Mark Attendance"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Student ID Field */}
          <div className="mb-3">
            <FormField
              label="Student ID"
              name="studentId"
              control={control}
              errors={errors}
              placeholder="Enter student ID"
              required
            />
          </div>

          {/* Status Field */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Status <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${styles.select} ${errors.status ? styles.selectError : ""}`}
              {...register("status")}
              disabled={isLoading}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
            {errors.status && (
              <div className={styles.error}>{errors.status.message}</div>
            )}
          </div>

          {/* Remarks Field */}
          <div className="mb-3">
            <TextareaField
              label="Remarks (Optional)"
              name="remarks"
              control={control}
              errors={errors}
              placeholder="Enter any remarks"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              className={styles.actionButton}
              disabled={isLoading}
              loading={isLoading}
            >
              {initialData ? "Update" : "Mark"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={styles.actionButton}
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
