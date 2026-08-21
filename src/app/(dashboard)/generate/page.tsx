"use client";

import { generatePaper } from "@/actions/generatePaper";
import { ExamPaperView } from "@/components/dashboard/ExamPaperView";
import { KeyConfigState, LLMKeyManager } from "@/components/LlmKeyManager";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  file: z.any().refine((file) => file instanceof File, {
    message: "File is required",
  }),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  units: z.number().int().positive("Units must be a positive integer"),
  q2m: z.number().int().min(0),
  q4m: z.number().int().min(0),
  q8m: z.number().int().min(0),
  q16m: z.number().int().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function GeneratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formSubtitle, setFormSubtitle] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [totalMarks, setTotalMarks] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [keyConfig, setKeyConfig] = useState<KeyConfigState | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      q2m: 0,
      q4m: 0,
      q8m: 0,
      q16m: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedUnits = watch("units");
  const selectedFile = watch("file");

  useEffect(() => {
    const storedConfig = sessionStorage.getItem("llm_key_config");
    if (storedConfig) {
      try {
        setKeyConfig(JSON.parse(storedConfig));
      } catch (e) {
        sessionStorage.removeItem("llm_key_config");
      }
    }
  }, []);

  useEffect(() => {
    if (selectedFile && selectedFile instanceof File) {
      const url = URL.createObjectURL(selectedFile);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [selectedFile]);

  const handleKeySave = (config: KeyConfigState) => {
    setKeyConfig(config);
    if (config.persistInSession) {
      sessionStorage.setItem("llm_key_config", JSON.stringify(config));
    } else {
      sessionStorage.removeItem("llm_key_config");
    }
  };

  const handleKeyClear = () => {
    setKeyConfig(null);
    sessionStorage.removeItem("llm_key_config");
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const calculatedTotalMarks =
      data.q2m * 2 + data.q4m * 4 + data.q8m * 8 + data.q16m * 16;

    setFormTitle(data.title);
    setFormSubtitle(data.subtitle || "");
    setFormDate(data.date);
    setTotalMarks(calculatedTotalMarks);

    try {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("title", data.title);
      if (data.subtitle) {
        formData.append("subtitle", data.subtitle);
      }
      formData.append("date", data.date);
      formData.append("units", data.units.toString());
      formData.append("q2m", data.q2m.toString());
      formData.append("q4m", data.q4m.toString());
      formData.append("q8m", data.q8m.toString());
      formData.append("q16m", data.q16m.toString());

      if (keyConfig) {
        formData.append("apiKey", keyConfig.apiKey);
        formData.append("provider", keyConfig.provider);
      }

      const response = await generatePaper(formData);

      if (response.error) {
        setError(response.error);
      } else if (response.success) {
        setResult(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight underline decoration-wavy decoration-neutral-600 mb-8">
          <span className="font-playfair">Generate</span> AI Paper
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-8">
          <div className="relative border border-border bg-card p-8 md:p-12">
            <Plus className="absolute size-6 text-muted-foreground bg-card stroke-[1.5] -top-3 -left-3" />
            <Plus className="absolute size-6 text-muted-foreground bg-card stroke-[1.5] -top-3 -right-3" />
            <Plus className="absolute size-6 text-muted-foreground bg-card stroke-[1.5] -bottom-3 -left-3" />
            <Plus className="absolute size-6 text-muted-foreground bg-card stroke-[1.5] -bottom-3 -right-3" />

            <LLMKeyManager
              initialProvider={keyConfig?.provider || "gemini"}
              onSave={handleKeySave}
              onClear={handleKeyClear}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-12 mt-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-6">
                  Document Metadata
                </h3>
                <div className="space-y-8">
                  <div>
                    <label
                      htmlFor="file"
                      className="block text-sm font-medium mb-3">
                      PDF File *
                    </label>
                    <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer">
                      <UploadCloud className="size-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                        Click to browse or drag PDF here
                      </span>
                      <input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("file", file, { shouldValidate: true });
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    {errors.file && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.file.message as string}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium mb-2">
                        Title *
                      </label>
                      <input
                        id="title"
                        type="text"
                        {...register("title")}
                        className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                      />
                      {errors.title && (
                        <p className="mt-2 text-sm text-destructive">
                          {errors.title.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="subtitle"
                        className="block text-sm font-medium mb-2">
                        Subtitle
                      </label>
                      <input
                        id="subtitle"
                        type="text"
                        {...register("subtitle")}
                        className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                      />
                      {errors.subtitle && (
                        <p className="mt-2 text-sm text-destructive">
                          {errors.subtitle.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium mb-2">
                        Date *
                      </label>
                      <input
                        id="date"
                        type="date"
                        {...register("date")}
                        className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                      />
                      {errors.date && (
                        <p className="mt-2 text-sm text-destructive">
                          {errors.date.message as string}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-6">
                  Exam Parameters
                </h3>
                <div>
                  <label
                    htmlFor="units"
                    className="block text-sm font-medium mb-2">
                    Total Units *
                  </label>
                  <input
                    id="units"
                    type="number"
                    {...register("units", { valueAsNumber: true })}
                    className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                  />
                  {errors.units && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.units.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-6">
                  Question Distribution
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label
                      htmlFor="q2m"
                      className="block text-sm font-medium mb-2">
                      2 Mark Questions
                    </label>
                    <input
                      id="q2m"
                      type="number"
                      {...register("q2m", { valueAsNumber: true })}
                      min="0"
                      className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.q2m && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.q2m.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="q4m"
                      className="block text-sm font-medium mb-2">
                      4 Mark Questions
                    </label>
                    <input
                      id="q4m"
                      type="number"
                      {...register("q4m", { valueAsNumber: true })}
                      min="0"
                      className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.q4m && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.q4m.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="q8m"
                      className="block text-sm font-medium mb-2">
                      8 Mark Questions
                    </label>
                    <input
                      id="q8m"
                      type="number"
                      {...register("q8m", { valueAsNumber: true })}
                      min="0"
                      className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.q8m && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.q8m.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="q16m"
                      className="block text-sm font-medium mb-2">
                      16 Mark Questions
                    </label>
                    <input
                      id="q16m"
                      type="number"
                      {...register("q16m", { valueAsNumber: true })}
                      min="0"
                      className="w-full bg-transparent border-0 border-b border-border py-2 px-0 text-foreground focus:ring-0 focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.q16m && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.q16m.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-12 px-8 py-4 bg-foreground text-background text-lg font-medium transition-all hover:scale-[1.01] hover:bg-foreground/90 disabled:opacity-50">
                {isLoading ? (
                  <span>
                    Processing {watchedUnits ? `${watchedUnits}-Unit ` : ""}
                    Syllabus...
                  </span>
                ) : (
                  "Generate Paper"
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-destructive/10 text-destructive border border-destructive/20">
                <p>{error}</p>
              </div>
            )}

            {result && formTitle && totalMarks > 0 && (
              <ExamPaperView
                jsonData={result}
                title={formTitle}
                subtitle={formSubtitle}
                date={formDate}
                totalMarks={totalMarks}
              />
            )}
          </div>

          <div className="sticky top-12 h-[calc(100vh-6rem)]">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border border-border"
                title="PDF Preview"
              />
            ) : (
              <div className="w-full h-full border border-border bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center">
                <p className="text-muted-foreground text-center px-4">
                  Upload a PDF file to preview it here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
