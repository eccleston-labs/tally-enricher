"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface FormData {
  workspace_name: string;
  form_provider: string;
  booking_url: string;
  success_page_url: string;
  min_employees: number;
  min_funding_usd: number;
  min_revenue_usd: number;
}

export default function DashboardPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateWorkspace = useMutation(api.workspaces.update);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    console.log(data);

    try {
      await updateWorkspace({
        workspace_name: data.workspace_name,
        form_provider: data.form_provider,
        booking_url: data.booking_url,
        success_page_url: data.success_page_url,
        criteria: {
          min_employees: Number(data.min_employees),
          min_funding_usd: Number(data.min_funding_usd),
          min_revenue_usd: Number(data.min_revenue_usd),
        },
      });

      alert("Workspace updated successfully!");
    } catch (error) {
      alert("Error updating workspace: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Workspace Configuration
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Workspace Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workspace Name
          </label>
          <input
            type="text"
            {...register("workspace_name", { required: "Required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.workspace_name && (
            <p className="text-sm text-red-600">
              {errors.workspace_name.message}
            </p>
          )}
        </div>

        {/* Form Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Form Provider
          </label>
          <select
            {...register("form_provider", { required: "Required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select provider</option>
            <option value="Tally">Tally</option>
            <option value="Typeform">Typeform</option>
            <option value="Custom">Custom</option>
          </select>
          {errors.form_provider && (
            <p className="text-sm text-red-600">
              {errors.form_provider.message}
            </p>
          )}
        </div>

        {/* Booking URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking URL (for qualified leads)
          </label>
          <input
            type="url"
            {...register("booking_url", { required: "Required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://calendly.com/your-link"
          />
          {errors.booking_url && (
            <p className="text-sm text-red-600">{errors.booking_url.message}</p>
          )}
        </div>

        {/* Success URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Success URL (for other leads)
          </label>
          <input
            type="url"
            {...register("success_page_url", { required: "Required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://yoursite.com/thanks"
          />
          {errors.success_page_url && (
            <p className="text-sm text-red-600">
              {errors.success_page_url.message}
            </p>
          )}
        </div>

        {/* Criteria */}
        <hr className="my-6" />
        <h2 className="text-lg font-semibold text-gray-800">
          Qualification Criteria
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Employees
          </label>
          <input
            type="number"
            {...register("min_employees", {
              required: "Required",
              min: 1,
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={400}
          />
          {errors.min_employees && (
            <p className="text-sm text-red-600">
              {errors.min_employees.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Funding (USD)
          </label>
          <input
            type="number"
            {...register("min_funding_usd", {
              required: "Required",
              min: 0,
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={100000000}
          />
          {errors.min_funding_usd && (
            <p className="text-sm text-red-600">
              {errors.min_funding_usd.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Revenue (USD)
          </label>
          <input
            type="number"
            {...register("min_revenue_usd", {
              required: "Required",
              min: 0,
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={50000000}
          />
          {errors.min_revenue_usd && (
            <p className="text-sm text-red-600">
              {errors.min_revenue_usd.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Updating..." : "Update Workspace"}
        </button>
      </form>
    </div>
  );
}
