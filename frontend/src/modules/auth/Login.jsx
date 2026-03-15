import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "./login.validation";
import { useMutation } from "@tanstack/react-query";
import api from "../../app/axios";
import { useAuth } from "../../app/authContext";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { FormField, PasswordField } from "../../components/FormField";
import { toastApiError, toastSuccess } from "../../utils/toast";
import ChartBarIcon from "../../assets/svg/ChartBarIcon";
import UsersIcon from "../../assets/svg/UsersIcon";
import RocketIcon from "../../assets/svg/RocketIcon";
import EyeOpen from "../../assets/svg/EyeOpen";
import EyeClosed from "../../assets/svg/EyeClosed";
import QueenAxeLogo from "../../assets/svg/QueenAxeLogo";
import styles from "./Login.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      toastSuccess("Login successfully");
      login(data.data);
      navigate("/dashboard");
    },
    onError: (error) => {
      toastApiError(error);
    },
  });

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className={`vh-100 d-flex ${styles.container}`}>
      <div
        className={`d-none d-md-flex flex-column justify-content-center align-items-center text-white position-relative ${styles.leftPanel}`}
      >
        <div className={styles.decorationCircle2} />
        <div className={styles.decorationCircle1} />

        <div className={styles.brandContent}>
          <div className={styles.brandIconWrap}>
            <div className={styles.brandLogoBadge}>
              <QueenAxeLogo width={160} className={styles.brandLogoImg} />
            </div>
          </div>

          <h1 className={styles.brandHeadline}>
            Empower Your
            <br />
            Learning Journey
          </h1>
          <p className={styles.brandTagline}>
            All-in-one platform to manage students, courses, attendance &amp;
            live virtual sessions.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <UsersIcon size={18} color="#2f7d57" />
              </div>
              <span>Manage teachers &amp; students effortlessly</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <ChartBarIcon size={18} color="#2f7d57" />
              </div>
              <span>Track attendance, progress &amp; analytics</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <RocketIcon size={18} color="#2f7d57" />
              </div>
              <span>Host &amp; join live virtual sessions</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`d-flex justify-content-center align-items-center w-100 position-relative ${styles.rightPanel}`}
      >
        <div className={styles.rightDecoration} />

        <div className={`glass animate-slide-in ${styles.loginCard}`}>
          <div className="text-center mb-4">
            <div className={styles.loginLogoContainer}>
              <QueenAxeLogo width={170} />
            </div>
            <h3 className={`fw-bold mb-2 ${styles.loginTitle}`}>
              Welcome Back!
            </h3>
            <p className={styles.loginSubtitle}>
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <FormField
                label="Email Address"
                name="email"
                type="email"
                placeholder="Enter your email"
                control={control}
                errors={errors}
              />
            </div>

            <div className="mb-4">
              <PasswordField
                label="Password"
                name="password"
                placeholder="Enter your password"
                control={control}
                errors={errors}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                PasswordIcon={
                  showPassword ? (
                    <EyeClosed width={20} height={20} color="currentColor" />
                  ) : (
                    <EyeOpen width={20} height={20} color="currentColor" />
                  )
                }
              />
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              className={`w-100 fw-semibold d-flex justify-content-center align-items-center ${styles.loginButton}`}
            >
              <span>Sign In</span>
              <span className={styles.arrow}>→</span>
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className={styles.footerText}>
              © 2026 QueenAxe. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
