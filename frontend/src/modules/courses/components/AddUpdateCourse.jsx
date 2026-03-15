import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { createCourseSchema } from "../courses.validation";
import { addCourse, updateCourse } from "../courses.api";
import toast from "react-hot-toast";
import Button from "../../../components/Button";
import { FormField, TextareaField } from "../../../components/FormField";
import modalStyles from "../../../components/Modal.module.css";

export default function AddUpdateCourse({
  onClose,
  onSuccess,
  courseData = null,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(createCourseSchema),
    defaultValues: courseData || {
      title: "",
      description: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (courseData) {
      setValue("title", courseData.title || "");
      setValue("description", courseData.description || "");
    }
  }, [courseData, setValue]);

  const addMutation = useMutation({
    mutationFn: addCourse,
    onSuccess: () => {
      toast.success("Course created successfully!");
      onSuccess();
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create course");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: () => {
      toast.success("Course updated successfully!");
      onSuccess();
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update course");
    },
  });

  const onSubmit = async (data) => {
    try {
      if (courseData) {
        await updateMutation.mutateAsync({
          id: courseData._id,
          courseData: data,
        });
      } else {
        await addMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;

  return (
    <div className={`modal d-block ${modalStyles.modalOverlay}`}>
      <div className={`modal-dialog modal-lg ${modalStyles.modalDialog}`}>
        <div
          className={`modal-content glass-card animate-fade-in ${modalStyles.modalContent}`}
        >
          <div className={`modal-header border-0 ${modalStyles.modalHeader}`}>
            <h5 className={`modal-title fw-bold ${modalStyles.modalTitle}`}>
              {courseData ? "Update Course" : "Add New Course"}
            </h5>
            <button
              type="button"
              onClick={onClose}
              className={`${modalStyles.closeButton} btn-close btn-close-white`}
            ></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={`modal-body ${modalStyles.modalBody}`}>
              <div className="row">
                {/* Title */}
                <div className="col-12 mb-3">
                  <FormField
                    label="Course Title"
                    name="title"
                    control={control}
                    errors={errors}
                    placeholder="Enter course title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="col-12 mb-3">
                  <TextareaField
                    label="Description"
                    name="description"
                    control={control}
                    errors={errors}
                    placeholder="Enter course description"
                  />
                </div>
              </div>
            </div>

            <div className={`modal-footer border-0 ${modalStyles.modalFooter}`}>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                loading={isLoading}
              >
                {courseData ? "Update Course" : "Add Course"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
