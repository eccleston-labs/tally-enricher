import { useFormContext, FieldError } from "react-hook-form";

export function WorkspaceConfigForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Workspace Name
        </label>
        <input
          type="text"
          {...register("workspace_name", { required: "Required" })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="AssemblyGTM"
        />
        {errors.workspace_name && (
          <p className="text-sm text-red-600">
            {String((errors.workspace_name as FieldError)?.message)}
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
          <p className="text-sm text-red-600">
            {String((errors.form_provider as FieldError)?.message)}
          </p>
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
          <p className="text-sm text-red-600">
            {String((errors.booking_url as FieldError)?.message)}
          </p>
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
            {String((errors.success_page_url as FieldError)?.message)}
          </p>
        )}
      </div>
    </>
  );
}