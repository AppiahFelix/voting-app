"use client";

import { useActionState, useRef, useEffect, useState } from "react";

type Action = (
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) => Promise<{ error?: string; success?: boolean }>;

export default function AddAspirantForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setPreview(null);
    }
  }, [state]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form ref={formRef} action={formAction} className="grid sm:grid-cols-2 gap-4">
      <Field label="Full name" name="name" required placeholder="e.g. Ama Owusu" />
      <Field label="Position" name="position" required placeholder="e.g. President" />
      <Field label="Category" name="category" placeholder="e.g. Faculty of Science (optional)" />
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="sex">
          Sex
        </label>
        <select
          id="sex"
          name="sex"
          className="w-full ballot-card px-3 py-2.5 focus:border-seal outline-none"
          defaultValue=""
        >
          <option value="">Prefer not to specify</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium mb-1" htmlFor="photo">
          Photo (optional)
        </label>
        <div className="flex items-center gap-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover border border-line"
            />
          )}
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-line file:text-ink file:text-sm file:font-medium hover:file:bg-ink-soft hover:file:text-white file:cursor-pointer cursor-pointer"
          />
        </div>
      </div>

      {state?.error && (
        <p className="sm:col-span-2 text-danger text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="sm:col-span-2 text-counted text-sm">Aspirant added.</p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="seal-button px-6 py-2.5 font-medium disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add aspirant"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full ballot-card px-3 py-2.5 focus:border-seal outline-none"
      />
    </div>
  );
}
