import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ApiProvider from "../../DataProvider";

export default function useEditTaskQuestions({ rowData }) {
  const apiRef = useRef(null);
  if (!apiRef.current) apiRef.current = new ApiProvider();
  const Api = apiRef.current;

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [showViewQuestionImgModal, setShowViewQuestionImgModal] = useState(false);

  const getQuestionsModel = useCallback(
    (type, Id) => {
      const date = rowData?.UpdatedOn ? rowData.UpdatedOn.split("-") : null;
      const updatedOn = date ? `${date[2]}-${date[1]}-${date[0]}` : null;
      return [{ CmdType: type, Id, date: updatedOn }];
    },
    [rowData?.UpdatedOn],
  );

  const loadQuestions = useCallback(() => {
    setLoadingQuestions(true);
    const model = getQuestionsModel("R", rowData?.TaskId);

    Api.manageQues(model, "R").then(async (resp) => {
      if (!resp?.ok) {
        setQuestions([]);
        setLoadingQuestions(false);
        return;
      }
      let rData = [];
      try {
        const text = await resp.text();
        rData = text ? JSON.parse(text) : [];
      } catch {
        rData = [];
      }
      const mapped = Array.isArray(rData)
        ? rData.map((q) => ({
            QuesId: q.QuestID,
            QuestionName: q.QuestionName,
            Action: q.Action,
            Remark: q.Remarks,
          }))
        : [];
      setQuestions(mapped);
      setLoadingQuestions(false);
    });
  }, [Api, getQuestionsModel, rowData?.TaskId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const hasAtLeastOneQuestion = useMemo(() => {
    return (questions || []).some((q) => q.QuestionName?.trim());
  }, [questions]);

  const openAddQuestion = useCallback(() => {
    setSelectedQuestion(null);
    setShowEditQuestionModal(true);
  }, []);

  const openEditQuestion = useCallback((q) => {
    setSelectedQuestion(q);
    setShowEditQuestionModal(true);
  }, []);

  const openViewImage = useCallback(
    (q) => {
      setSelectedQuestion({ QuesId: q.QuesId, TaskId: rowData?.TaskId });
      setShowViewQuestionImgModal(true);
    },
    [rowData?.TaskId],
  );

  const onQuestionSave = useCallback((question) => {
    setQuestions((prev) => {
      const exists = prev.some((q) => q.QuesId === question.QuesId);
      return exists ? prev.map((q) => (q.QuesId === question.QuesId ? question : q)) : [...prev, question];
    });
  }, []);

  const removeQuestionLocal = useCallback((quesId) => {
    setQuestions((prev) => prev.filter((q) => q.QuesId !== quesId));
  }, []);

  return {
    questions,
    setQuestions,
    loadingQuestions,
    selectedQuestion,
    showEditQuestionModal,
    showViewQuestionImgModal,
    hasAtLeastOneQuestion,
    openAddQuestion,
    openEditQuestion,
    openViewImage,
    onQuestionSave,
    removeQuestionLocal,
    setShowEditQuestionModal,
    setShowViewQuestionImgModal,
    setSelectedQuestion,
    reloadQuestions: loadQuestions,
  };
}

