import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import {
  createStudentSchema,
  updateStudentSchema,
} from "../students.validation";
import { addStudent, updateStudent } from "../students.api";
import toast from "react-hot-toast";
import Button from "../../../components/Button";
import { FormField, PasswordField } from "../../../components/FormField";
import styles from "./AddUpdateStudent.module.css";
import modalStyles from "../../../components/Modal.module.css";
import EyeOpen from "../../../assets/svg/EyeOpen";
import EyeClosed from "../../../assets/svg/EyeClosed";

export default function AddUpdateStudent({
  onClose,
  onSuccess,
  student = null,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(student ? updateStudentSchema : createStudentSchema),
  });

  useEffect(() => {
    if (student) {
      setValue("name", student.name || "");
      setValue("email", student.email || "");
      setValue("phone", student.phone || "");
      setValue("parents.father.name", student.parents?.father?.name || "");
      setValue("parents.father.phone", student.parents?.father?.phone || "");
      setValue("parents.mother.name", student.parents?.mother?.name || "");
      setValue("parents.mother.phone", student.parents?.mother?.phone || "");
    }
  }, [student, setValue]);

  const addMutation = useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      toast.success("Student created successfully!");
      onSuccess();
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create student");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateStudent,
    onSuccess: () => {
      toast.success("Student updated successfully!");
      onSuccess();
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update student");
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };

      if (student) {
        await updateMutation.mutateAsync({
          id: student._id,
          studentData: payload,
        });
      } else {
        await addMutation.mutateAsync(payload);
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
              {student ? "Update Student" : "Add New Student"}
            </h5>
            <button
              type="button"
              className={`${modalStyles.closeButton} btn-close btn-close-white`}
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={`modal-body ${modalStyles.modalBody}`}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormField
                    label="Name"
                    name="name"
                    control={control}
                    errors={errors}
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <FormField
                    label="Email"
                    name="email"
                    control={control}
                    errors={errors}
                    type="email"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <FormField
                    label="Phone"
                    name="phone"
                    control={control}
                    errors={errors}
                    type="tel"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                {!student && (
                  <div className="col-md-6 mb-3">
                    <PasswordField
                      label="Password"
                      name="password"
                      control={control}
                      errors={errors}
                      placeholder="Enter password"
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      PasswordIcon={showPassword ? <EyeOpen /> : <EyeClosed />}
                      required
                    />
                  </div>
                )}

                <div className="col-12 mb-3">
                  <h6 className={styles.sectionHeader}>
                    Parent Details (Optional)
                  </h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <FormField
                        label="Father Name"
                        name="parents.father.name"
                        control={control}
                        errors={errors}
                        placeholder="Enter father name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <FormField
                        label="Father Phone"
                        name="parents.father.phone"
                        control={control}
                        errors={errors}
                        type="tel"
                        placeholder="Enter father phone"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12 mb-3">
                  <h6 className={styles.sectionHeader}>
                    Mother Details (Optional)
                  </h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <FormField
                        label="Name"
                        name="parents.mother.name"
                        control={control}
                        errors={errors}
                        placeholder="Enter mother name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <FormField
                        label="Phone"
                        name="parents.mother.phone"
                        control={control}
                        errors={errors}
                        type="tel"
                        placeholder="Enter mother phone"
                      />
                    </div>
                  </div>
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
                {student ? "Update Student" : "Add Student"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
