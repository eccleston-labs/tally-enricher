import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import type { Doc } from "@/convex/_generated/dataModel";

import { api } from "@/convex/_generated/api";
import { redis } from "@/lib/index";

interface FormData {
  workspace_name: string;
  form_provider: string;
  booking_url: string;
  success_page_url: string;
  min_employees: number;
  min_funding_usd: number;
  min_revenue_usd: number;
}

export function WorkspaceForm({
  setWorkspaceName,
  initialData,
}: {
  setWorkspaceName: (name: string) => void;
  initialData?: Doc<"Workspaces"> | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateWorkspace = useMutation(api.workspaces.update);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      workspace_name: "",
      form_provider: "",
      booking_url: "",
      success_page_url: "",
      min_employees: 400,
      min_funding_usd: 100000000,
      min_revenue_usd: 50000000,
    },
  });

  // Pre-populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        workspace_name: initialData.workspace_name,
        form_provider: initialData.form_provider,
        booking_url: initialData.booking_url,
        success_page_url: initialData.success_page_url,
        min_employees: initialData.criteria?.min_employees || 400,
        min_funding_usd: initialData.criteria?.min_funding_usd || 100000000,
        min_revenue_usd: initialData.criteria?.min_revenue_usd || 50000000,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    function sanitizeNumber(n: unknown, fallback = 10000) {
      // Accepts string or number, returns number or fallback.
      const num = typeof n === "number" ? n : Number(n);
      return typeof num === "number" && !isNaN(num) ? num : fallback;
    }

    // Set workspace name in parent state
    setWorkspaceName(data.workspace_name);

    try {
      await updateWorkspace({
        workspace_name: data.workspace_name,
        form_provider: data.form_provider,
        booking_url: data.booking_url,
        success_page_url: data.success_page_url,
        criteria: {
          min_employees: sanitizeNumber(data.min_employees),
          min_funding_usd: sanitizeNumber(data.min_funding_usd),
          min_revenue_usd: sanitizeNumber(data.min_revenue_usd),
        },
      });

      // Clear the Redis cache for this workspace
      const cacheKey = `workspace:${data.workspace_name}`;
      await redis.del(cacheKey);

      alert("Workspace updated successfully!");
    } catch (error) {
      alert("Error updating workspace: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <p className="text-sm text-red-600">{errors.form_provider.message}</p>
        )}
      </div>

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
        />
        {errors.min_employees && (
          <p className="text-sm text-red-600">{errors.min_employees.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Funding (USD)
        </label>
        <input
          type="number"
          {...register("min_funding_usd", {
            min: 0,
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            min: 0,
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        {isSubmitting
          ? "Updating..."
          : initialData
            ? "Update Workspace"
            : "Create Workspace"}
      </button>
    </form>
  );
}
