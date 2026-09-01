"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function StudentPortal() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState("signup");
  const [currentUser, setCurrentUser] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState([]);

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      if (!res.ok) throw new Error("Could not load courses");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students?include=courses");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data;
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid, isDirty, touchedFields },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      matricNo: "",
      programme: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (values) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          courseIds: [],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw { status: res.status, ...json };
      return json.data;
    },
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setCurrentUser(student);
      setEnrolledIds([]);
      setStep("courses");
    },
    onError: (err) => {
      if (err.status === 409) {
        setError("email", { message: "This email is already in use." });
      } else if (err.error?.fields) {
        Object.entries(err.error.fields).forEach(([f, msgs]) => {
          setError(f, { message: msgs[0] });
        });
      } else {
        alert("Something went wrong. Please check your details.");
      }
    },
  });

  const toggleCourse = async (courseId) => {
    if (!currentUser) return;
    const isEnrolled = enrolledIds.includes(courseId);

    try {
      if (isEnrolled) {
        await fetch(`/api/students/${currentUser.id}/courses/${courseId}`, {
          method: "DELETE",
        });
        setEnrolledIds((prev) => prev.filter((id) => id !== courseId));
      } else {
        await fetch(`/api/students/${currentUser.id}/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
        setEnrolledIds((prev) => [...prev, courseId]);
      }
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch {
      alert("Failed to update course.");
    }
  };

  const onSubmitSignup = (data) => {
    if (data.password && data.password !== data.confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#edeef2] text-[#1b1c3a] flex flex-col justify-between py-8 px-4 font-sans antialiased">
      <div className="max-w-4xl mx-auto w-full my-auto">
        {step === "signup" && (
          <div className="bg-white rounded-[28px] shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* University Crest Panel */}
            <div className="md:col-span-5 bg-[#fafafa] border-b md:border-b-0 md:border-r border-gray-200 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-[#1b1c3a] border-2 border-[#b89120] flex items-center justify-center text-3xl shadow-sm mb-4">
                🛡️
              </div>
              <h2 className="text-xl font-bold font-serif text-[#1b1c3a]">
                Dominion University
              </h2>
              <p className="text-xs text-gray-500 font-medium">Ibadan</p>
            </div>

            {/* Form Side */}
            <div className="md:col-span-7 p-8 md:p-10">
              <h1 className="text-2xl font-bold font-serif text-[#1b1c3a] mb-6">
                Create Account
              </h1>

              <form
                onSubmit={handleSubmit(onSubmitSignup)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      First Name
                    </label>
                    <input
                      {...register("firstName", {
                        required: "First name is required",
                      })}
                      placeholder="Triumph"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                    />
                    {errors.firstName && (
                      <span className="text-[11px] text-red-500">
                        {errors.firstName.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Last Name
                    </label>
                    <input
                      {...register("lastName", {
                        required: "Last name is required",
                      })}
                      placeholder="DU0000"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                    />
                    {errors.lastName && (
                      <span className="text-[11px] text-red-500">
                        {errors.lastName.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Matric No
                    </label>
                    <input
                      {...register("matricNo")}
                      placeholder="DU0389"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Programme
                    </label>
                    <input
                      {...register("programme")}
                      placeholder="Cyber-Security"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Enter a valid email",
                      },
                    })}
                    placeholder="triumpholajimi@gmail.com"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                  />
                  {errors.email && (
                    <span className="text-[11px] text-red-500">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      {...register("password")}
                      placeholder="••••••••••"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="••••••••••"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#b89120]"
                    />
                    {errors.confirmPassword && (
                      <span className="text-[11px] text-red-500">
                        {errors.confirmPassword.message}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || signupMutation.isPending}
                  className="w-full mt-2 py-3 bg-[#b89120] hover:bg-[#a6821b] text-white font-medium rounded-xl text-sm transition"
                >
                  {signupMutation.isPending ? "Creating..." : "Sign up"}
                </button>

                <p className="text-center text-xs text-gray-500 pt-1">
                  Already a Member?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (students.length > 0) {
                        setCurrentUser(students[0]);
                        setEnrolledIds(students[0].courseIds || []);
                        setStep("courses");
                      } else {
                        alert("No existing accounts found. Please sign up.");
                      }
                    }}
                    className="text-[#1b1c3a] font-semibold underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          </div>
        )}

        {step === "courses" && (
          <div className="bg-white rounded-[28px] p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h1 className="text-xl font-bold font-serif text-[#1b1c3a]">
                  Welcome, {currentUser?.firstName}!
                </h1>
                <p className="text-xs text-gray-500">
                  Select the courses you would like to take this semester.
                </p>
              </div>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                {enrolledIds.length} Selected
              </span>
            </div>

            {loadingCourses ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                Loading course list...
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.map((c) => {
                  const selected = enrolledIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCourse(c.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                        selected
                          ? "bg-[#faf7ee] border-[#b89120]"
                          : "bg-gray-50/60 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-[#b89120] font-mono">
                          {c.code}
                        </span>
                        <h3 className="text-sm font-semibold text-[#1b1c3a] mt-0.5">
                          {c.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {c.instructor} • {c.credits} Credits
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                          selected
                            ? "bg-[#b89120] text-white"
                            : "border border-gray-300"
                        }`}
                      >
                        {selected ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep("signup")}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                ← Back to Account
              </button>

              <button
                type="button"
                onClick={() => setStep("summary")}
                className="py-2.5 px-6 bg-[#1b1c3a] text-white text-xs font-semibold rounded-xl hover:bg-[#282a54] transition"
              >
                Save & View Profile →
              </button>
            </div>
          </div>
        )}

        {step === "summary" && (
          <div className="bg-white rounded-[28px] p-8 border border-gray-200 shadow-sm max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h1 className="text-xl font-bold font-serif text-[#1b1c3a]">
                Registration Complete
              </h1>
              <p className="text-xs text-gray-500">
                You are enrolled for the upcoming academic session.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Student</span>
                <span className="font-semibold text-gray-800">
                  {currentUser?.firstName} {currentUser?.lastName}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-800">
                  {currentUser?.email}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">
                  Enrolled Courses:
                </span>
                <div className="space-y-1 pl-2">
                  {courses
                    .filter((c) => enrolledIds.includes(c.id))
                    .map((c) => (
                      <div key={c.id} className="font-medium text-gray-800">
                        • {c.code}: {c.title} ({c.credits} cr)
                      </div>
                    ))}
                  {enrolledIds.length === 0 && (
                    <span className="text-gray-400 italic">
                      No courses selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("courses")}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200"
              >
                Change Courses
              </button>
              <button
                type="button"
                onClick={() => setStep("signup")}
                className="flex-1 py-2.5 bg-[#b89120] text-white text-xs font-semibold rounded-xl hover:bg-[#a6821b]"
              >
                Register Another Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
