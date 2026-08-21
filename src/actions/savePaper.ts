"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function savePaperToDatabase(
  paperData: any,
  title: string,
  totalMarks: number,
) {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: paper, error: paperError } = await supabase
    .from("papers")
    .insert({
      teacher_id: user.id,
      title: title,
      total_marks: totalMarks,
    })
    .select()
    .single();

  if (paperError) {
    throw new Error(`Failed to insert paper: ${paperError.message}`);
  }

  const questionsArray: Array<{
    paper_id: string | number;
    unit_number: number;
    marks: number;
    blooms_level: string;
    question_text: string;
  }> = [];

  if (paperData.sections && Array.isArray(paperData.sections)) {
    paperData.sections.forEach((section: any) => {
      if (section.questions && Array.isArray(section.questions)) {
        section.questions.forEach((question: any) => {
          questionsArray.push({
            paper_id: paper.id,
            unit_number: parseInt(
              question.unit.toString().match(/\d+/)?.[0] || "0",
            ),
            marks: parseInt(question.marks) || 0,
            blooms_level: question.blooms_taxonomy_level,
            question_text: question.question_text,
          });
        });
      }
    });
  } else if (paperData.questions && Array.isArray(paperData.questions)) {
    paperData.questions.forEach((question: any) => {
      questionsArray.push({
        paper_id: paper.id,
        unit_number: parseInt(
          question.unit.toString().match(/\d+/)?.[0] || "0",
        ),
        marks: parseInt(question.marks) || 0,
        blooms_level: question.blooms_taxonomy_level,
        question_text: question.question_text,
      });
    });
  }

  if (questionsArray.length > 0) {
    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsArray);

    if (questionsError) {
      throw new Error(`Failed to insert questions: ${questionsError.message}`);
    }
  }

  return { success: true };
}
