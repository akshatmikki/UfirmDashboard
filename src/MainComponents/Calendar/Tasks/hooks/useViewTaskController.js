import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import ApiProvider from "../../DataProvider";

export default function useViewTaskController({ rowData }) {
  const apiRef = useRef(null);
  if (!apiRef.current) apiRef.current = new ApiProvider();
  const Api = apiRef.current;

  const [propertyData, setPropertyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    rowData?.TaskCategoryId ? Number(rowData.TaskCategoryId) : null,
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState(
    rowData?.TaskSubCategoryId ? Number(rowData.TaskSubCategoryId) : null,
  );

  const [assets, setAssets] = useState([]);
  const [assetDetails, setAssetDetails] = useState({
    assetName: "",
    assetBrand: "",
    lastServiceDate: "",
    nextServiceDate: "",
    assetPhoto: null,
    QRCode: "",
  });

  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showViewQuestionImgModal, setShowViewQuestionImgModal] = useState(false);

  const taskId = rowData?.TaskId ?? rowData?.taskId ?? rowData?.Id ?? rowData?.id ?? 0;
  const propertyId = rowData?.PropertyId ?? rowData?.propertyId ?? rowData?.PropertyID ?? 0;

  const startDate = useMemo(() => {
    return rowData?.DateFrom ? moment(rowData.DateFrom).format("DD/MM/YYYY") : "";
  }, [rowData?.DateFrom]);

  const endDate = useMemo(() => {
    if (!rowData?.DateFrom) return "";
    if (rowData?.DateTo && moment(rowData.DateTo).isSameOrAfter(rowData.DateFrom)) {
      return moment(rowData.DateTo).format("DD/MM/YYYY");
    }
    return moment(rowData.DateFrom).format("DD/MM/YYYY");
  }, [rowData?.DateFrom, rowData?.DateTo]);

  const startTime = useMemo(() => {
    return rowData?.TimeFrom ? moment(rowData.TimeFrom, ["HH:mm:ss", "HH:mm"]).format("h:mm A") : "";
  }, [rowData?.TimeFrom]);

  const endTime = useMemo(() => {
    return rowData?.TimeTo ? moment(rowData.TimeTo, ["HH:mm:ss", "HH:mm"]).format("h:mm A") : "";
  }, [rowData?.TimeTo]);

  const remindme = rowData?.RemindMe;
  const check = rowData?.AllDay === "Y";

  const initialTaskDate = useMemo(() => {
    const raw = rowData?.UpdatedOn || rowData?.DateFrom || "";
    if (!raw) return "";
    const parsed = moment(
      raw,
      ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601],
      true,
    );
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
  }, [rowData?.DateFrom, rowData?.UpdatedOn]);

  const getAllProperties = useCallback(() => {
    const model = [{ CmdType: "R" }];
    Api.manageProperties(model, "R").then((resp) => {
      if (!resp.ok || resp.status !== 200) return;
      resp.json().then((rData) => {
        const props = (rData || []).map((e) => ({
          propertyId: e.PropertyId,
          name: e.Name,
        }));
        setPropertyData(props);
      });
    });
  }, [Api]);

  const getCategory = useCallback(() => {
    const model = [{ CmdType: "R" }];
    Api.manageCategory(model, "R").then((resp) => {
      if (!resp.ok || resp.status !== 200) return;
      resp.json().then((rData) => {
        const cats = (rData || []).map((e) => ({ Id: e.catId, Name: e.name }));
        setCategoryData(cats);
      });
    });
  }, [Api]);

  const getSubCategory = useCallback(
    (categoryId) => {
      const model = [{ CmdType: "R" }];
      Api.manageSubCategory(model, "R", categoryId || 0).then((resp) => {
        if (!resp.ok || resp.status !== 200) return;
        resp.json().then((rData) => {
          const list = (rData || []).map((e) => ({
            SubCategoryId: e.SubCategoryId,
            SubCategoryName: e.SubCategoryName,
          }));
          setSubCategory(list);
        });
      });
    },
    [Api],
  );

  const getAssets = useCallback(
    (propId) => {
      if (!propId) return;
      const model = [{ CmdType: "R" }];
      model.propertyId = propId;
      Api.manageAssets(model, "R").then((resp) => {
        if (!resp.ok || resp.status !== 200) return;
        resp.json().then((rData) => {
          const list = [...(rData?.PassedServiceDates || []), ...(rData?.UpcomingServiceDates || [])].map((a) => ({
            assetId: a.Id,
            assetName: a.Name,
            assetBrand: a.Brand || a.Manufacturer || "",
            lastServiceDate: a.LastServiceDate,
            nextServiceDate: a.NextServiceDate,
            assetPhoto: a.AssetImage,
            QRCode: a.QRCode,
          }));
          setAssets(list);
        });
      });
    },
    [Api],
  );

  const populateAssetDetails = useCallback(
    (assetId) => {
      const asset = (assets || []).find((a) => String(a.assetId) === String(assetId));
      if (!asset) return;
      setAssetDetails({
        assetName: asset.assetName,
        assetBrand: asset.assetBrand,
        lastServiceDate: asset.lastServiceDate,
        nextServiceDate: asset.nextServiceDate,
        assetPhoto: asset.assetPhoto,
        QRCode: asset.QRCode,
      });
    },
    [assets],
  );

  const loadQuestions = useCallback(() => {
    const type = "R";
    if (!taskId) return;
    const parseTaskDate = (value) => {
      if (!value) return null;
      const strict = moment(
        value,
        ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601],
        true,
      );
      if (strict.isValid()) return strict;
      const loose = moment(value);
      return loose.isValid() ? loose : null;
    };

    const parsed = parseTaskDate(rowData?.UpdatedOn) || parseTaskDate(rowData?.DateFrom);
    const updatedOn = parsed ? parsed.format("YYYY-MM-DD") : null;
    const model = [{ CmdType: type, Id: taskId, date: updatedOn }];

    Api.manageQues(model, type).then((resp) => {
      if (!resp?.ok) return;
      resp
        .text()
        .then((text) => {
          if (!text) return [];
          try {
            return JSON.parse(text);
          } catch {
            return [];
          }
        })
        .then((rData) => {
          const list = Array.isArray(rData)
            ? rData.map((e) => ({
                QuesId: e.QuestID ?? e.QuestId ?? e.QuestionId ?? e.QuesId ?? e.QuesID ?? e.id,
                QuesName: e.QuestionName ?? e.QuesName ?? e.Question ?? e.name,
                Action: e.Action,
                Remark: e.Remarks,
              }))
            : [];
          setQuestions(list);
        })
        .catch(() => {
          setQuestions([]);
        });
    });
  }, [Api, rowData?.DateFrom, rowData?.UpdatedOn, taskId]);

  useEffect(() => {
    getAllProperties();
    getCategory();
    if (propertyId) getAssets(propertyId);
    loadQuestions();
  }, [getAllProperties, getAssets, getCategory, loadQuestions, propertyId]);

  useEffect(() => {
    if (selectedCategory) getSubCategory(selectedCategory);
  }, [getSubCategory, selectedCategory]);

  useEffect(() => {
    if (assets.length && rowData?.AssetId) populateAssetDetails(rowData.AssetId);
  }, [assets, populateAssetDetails, rowData?.AssetId]);

  const openViewImage = useCallback((q) => {
    setSelectedQuestion(q);
    setShowViewQuestionImgModal(true);
  }, []);

  return {
    propertyId,
    propertyData,
    categoryData,
    subCategory,
    selectedCategory,
    selectedSubCategory,
    setSelectedCategory,
    setSelectedSubCategory,
    startDate,
    endDate,
    startTime,
    endTime,
    remindme,
    check,
    assets,
    assetDetails,
    questions,
    selectedQuestion,
    showViewQuestionImgModal,
    setShowViewQuestionImgModal,
    openViewImage,
    initialTaskDate,
  };
}

