"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

interface FormData {
  formProvider: string;
  calendarApp: string;
  otherCalendarApp?: string;
}

interface CriteriaData {
  headcount: number;
  arr: number;
  funding: number;
}

export default function DashboardPage() {
  const [showCriteria, setShowCriteria] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>();

  const watchCalendarApp = watch("calendarApp");

  const {
    register: registerCriteria,
    handleSubmit: handleSubmitCriteria,
    formState: { errors: criteriaErrors },
  } = useForm<CriteriaData>();

  const onSubmit = (data: FormData) => {
    // Save to localStorage for now (we'll save to Supabase after criteria)
    localStorage.setItem("formData", JSON.stringify(data));
    console.log("Form data saved:", data);

    // Show criteria form
    setShowCriteria(true);
  };

  const onSubmitCriteria = async (data: CriteriaData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the previously saved form data
      const savedFormData = localStorage.getItem("formData");
      const formData = savedFormData ? JSON.parse(savedFormData) : {};

      // Combine all form data into a single object
      const combinedData = {
        ...formData,
        ...data,
      };

      console.log("Complete form submission:", combinedData);

      // For now, use a hardcoded workspace_id - you'll need to implement workspace management
      // const TEMP_WORKSPACE_ID = "de4bb877-a5f0-416c-82bd-c530e76832e8";

      // Clear localStorage on successful submission
      localStorage.removeItem("formData");
      localStorage.removeItem("criteriaData");

      console.log("Data successfully saved to Supabase!");
      // You might want to navigate to a success page or show a success message here
    } catch (err) {
      console.error("Error saving to Supabase:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving data",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCriteria) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Criteria</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmitCriteria(onSubmitCriteria)}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="headcount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Headcount
            </label>
            <input
              type="number"
              id="headcount"
              {...registerCriteria("headcount", {
                required: "Headcount is required",
                min: {
                  value: 1,
                  message: "Headcount must be at least 1",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {criteriaErrors.headcount && (
              <p className="mt-1 text-sm text-red-600">
                {criteriaErrors.headcount.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="arr"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ARR
            </label>
            <input
              type="number"
              id="arr"
              {...registerCriteria("arr", {
                required: "ARR is required",
                min: {
                  value: 0,
                  message: "ARR must be at least 0",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {criteriaErrors.arr && (
              <p className="mt-1 text-sm text-red-600">
                {criteriaErrors.arr.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="funding"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Funding
            </label>
            <input
              type="number"
              id="funding"
              {...registerCriteria("funding", {
                required: "Funding is required",
                min: {
                  value: 0,
                  message: "Funding must be at least 0",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {criteriaErrors.funding && (
              <p className="mt-1 text-sm text-red-600">
                {criteriaErrors.funding.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Configuration</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="formProvider"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Form Provider
          </label>
          <select
            id="formProvider"
            {...register("formProvider", {
              required: "Form provider is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a form provider</option>
            <option value="tally">Tally</option>
            <option value="fillout">Fillout</option>
            <option value="typeform">Typeform</option>
            <option value="custom">Custom</option>
          </select>
          {errors.formProvider && (
            <p className="mt-1 text-sm text-red-600">
              {errors.formProvider.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="calendarApp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Calendar App
          </label>
          <select
            id="calendarApp"
            {...register("calendarApp", {
              required: "Calendar app is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a calendar app</option>
            <option value="cal.com">Cal.com</option>
            <option value="calendly">Calendly</option>
            <option value="other">Other</option>
          </select>
          {errors.calendarApp && (
            <p className="mt-1 text-sm text-red-600">
              {errors.calendarApp.message}
            </p>
          )}
        </div>

        {watchCalendarApp === "other" && (
          <div>
            <label
              htmlFor="otherCalendarApp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Specify Calendar App
            </label>
            <input
              type="text"
              id="otherCalendarApp"
              {...register("otherCalendarApp", {
                required:
                  watchCalendarApp === "other"
                    ? "Please specify the calendar app"
                    : false,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter calendar app name"
            />
            {errors.otherCalendarApp && (
              <p className="mt-1 text-sm text-red-600">
                {errors.otherCalendarApp.message}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
        >
          Next
        </button>
      </form>
    </div>
  );
}
