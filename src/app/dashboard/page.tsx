"use client";

import { useForm } from "react-hook-form";

interface FormData {
  formProvider: string;
  bookingUrl: string;
  successPage: string;
}

export default function DashboardPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log("Form data:", data);
    // Handle form submission here
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="formProvider"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Form Provider
          </label>
          <input
            type="text"
            id="formProvider"
            {...register("formProvider", {
              required: "Form provider is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.formProvider && (
            <p className="mt-1 text-sm text-red-600">
              {errors.formProvider.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bookingUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Booking URL
          </label>
          <input
            type="url"
            id="bookingUrl"
            {...register("bookingUrl", {
              required: "Booking URL is required",
              pattern: {
                value: /^https?:\/\/.+/,
                message: "Please enter a valid URL",
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.bookingUrl && (
            <p className="mt-1 text-sm text-red-600">
              {errors.bookingUrl.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="successPage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Success Page
          </label>
          <input
            type="text"
            id="successPage"
            {...register("successPage", {
              required: "Success page is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.successPage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.successPage.message}
            </p>
          )}
        </div>

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
