import { useForm } from "react-hook-form";
import { MdAlternateEmail, MdFingerprint } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import styles from "./index.module.scss";
import { RegisterData } from "../../../types/authentication";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import AuthContext from "../../../utils/context/authContext";
import { SafeUser } from "../../../types/conversation";
import { toast } from "sonner"
import { AxiosError } from "axios";

const RegisterPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterData>();

  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: succesToast, error: errorToast } = toast;

  const { mutate } = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["register__user", data.data.id], data);
      console.log("Registration successful", data);
      setUser(data.data as SafeUser);
      succesToast("Registration successful !!");
      navigate("/conversations/");
    },
    onError: (error) => {
      console.log("Registration failed", error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          errorToast("Email already exists");
        }
        if (error.response?.status === 400) {
          errorToast("Invalid data");
        }
        errorToast(error.response?.statusText);
      }
      errorToast("Registration failed !!");
    },
  });

  const submitHandler = async (data: RegisterData) => mutate(data);

  return (
    <main className={styles.mainBG}>
      <div className={styles.modal}>
        <div className={styles.left}>
          <div className={styles.heading}>
            <span>Hey, </span>
            <div>Start Your Journey</div>
          </div>
        </div>
        <div className={styles.right}>
          <form onSubmit={handleSubmit(submitHandler)} className="text-white">
            <div className={styles.name__container}>
              <div className={styles.form__group}>
                <label htmlFor="firstname">First Name</label>
                <div
                  style={{
                    // @ts-ignore
                    "--input-color": errors.firstName
                      ? "var(--clr-danger)"
                      : "none",
                  }}
                  className={styles.input__container}
                >
                  <FaUser />
                  <input
                    type="text"
                    id="firstname"
                    className={`flex-1 ${styles.input} ${
                      errors.firstName && errors.firstName.type === "required"
                        ? `${styles.invalid__input}`
                        : ""
                    }`}
                    placeholder="First Name"
                    {...register("firstName", {
                      minLength: {
                        value: 2,
                        message: "First Name must have at least 2 characters",
                      },
                      required: "First Name is required",
                    })}
                  />
                </div>
              </div>
              <div className={styles.form__group}>
                <label htmlFor="lastname">Last Name</label>
                <div
                  style={{
                    // @ts-ignore
                    "--input-color": errors.lastName
                      ? "var(--clr-danger)"
                      : "none",
                  }}
                  className={styles.input__container}
                >
                  <FaUser />
                  <input
                    type="text"
                    id="lastname"
                    className={`flex-1 ${styles.input} ${
                      errors.lastName && errors.lastName.type === "required"
                        ? `${styles.invalid__input}`
                        : ""
                    }`}
                    placeholder="Last Name"
                    {...register("lastName", {
                      minLength: {
                        value: 2,
                        message: "Last Name must have at least 2 characters",
                      },
                      required: "Last Name is required",
                    })}
                  />
                </div>
              </div>
            </div>
            <div className={styles.form__group}>
              <label htmlFor="email">Email</label>
              <div
                style={{
                  // @ts-ignore
                  "--input-color": errors.email ? "var(--clr-danger)" : "none",
                }}
                className={styles.input__container}
              >
                <MdAlternateEmail />
                <input
                  type="email"
                  id="email"
                  className={`flex-1 ${styles.input} ${
                    errors.email && errors.email.type === "required"
                      ? `${styles.invalid__input}`
                      : ""
                  }`}
                  placeholder="Enter your email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Entered value does not match email format",
                    },
                  })}
                />
              </div>
              {
                // @ts-ignore
                errors.email && (
                  <div className={styles.invalid__feedback}>
                    {errors.email.message}
                  </div>
                )
              }
            </div>
            <div className={styles.form__group}>
              <label htmlFor="password">Password</label>
              <div
                style={{
                  // @ts-ignore
                  "--input-color": errors.password
                    ? "var(--clr-danger)"
                    : "none",
                }}
                className={styles.input__container}
              >
                <MdFingerprint />
                <input
                  type="password"
                  id="password"
                  className={`flex-1 ${styles.input} ${
                    errors.password ? "is-invalid" : ""
                  }`}
                  placeholder="Enter your password"
                  {...register("password", {
                    minLength: {
                      value: 6,
                      message: "Password must have at least 6 characters",
                    },
                    required: "Password is required",
                  })}
                />
              </div>
              {
                // @ts-ignore
                errors.password && (
                  <div className={styles.invalid__feedback}>
                    {errors.password.message}
                  </div>
                )
              }
            </div>
            <div className={styles.form__group}>
              <label htmlFor="confPassword">Confirm Password</label>
              <div
                style={{
                  // @ts-ignore
                  "--input-color": errors.confPassword
                    ? "var(--clr-danger)"
                    : "none",
                }}
                className={styles.input__container}
              >
                <MdFingerprint />
                <input
                  type="password"
                  id="confPassword"
                  className={`flex-1 ${styles.input} ${
                    errors.confPassword ? "is-invalid" : ""
                  }`}
                  placeholder="Confirm password"
                  {...register("confPassword", {
                    minLength: {
                      value: 6,
                      message: "Password must have at least 6 characters",
                    },
                    required: "Confirm Password is required",
                    validate: (value) =>
                      value === getValues("password") ||
                      "The passwords do not match",
                  })}
                />
              </div>
              {errors.confPassword && (
                <div className={styles.invalid__feedback}>
                  {errors.confPassword.message}
                </div>
              )}
            </div>
            <div className={styles.form__group}>
              <button type="submit" className={`${styles.btn} login__btn`}>
                Create Account
              </button>
            </div>
          </form>
          <div className="mb-4">
            <span>
              Already have an account?
              <Link className="ml-2 text-blue-400" to={"/auth/login"}>
                Login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
