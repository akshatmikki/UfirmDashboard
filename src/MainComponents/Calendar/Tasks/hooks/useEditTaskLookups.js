import { useCallback, useEffect, useRef, useState } from "react";
import ApiProvider from "../../DataProvider";
import { getFrequencyList, getShiftList } from "../../../../Services/masterService";

export default function useEditTaskLookups({
  propertyId,
  selectedCategory,
  assetId,
  updateForm,
}) {
  const apiRef = useRef(null);
  if (!apiRef.current) apiRef.current = new ApiProvider();
  const Api = apiRef.current;

  const [subCategory, setSubCategory] = useState([]);
  const [assign, setAssign] = useState([]);
  const [propertyData, setPropertyData] = useState([]);
  const [assets, setAssets] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [shifts, setShifts] = useState([]);

  const occurrenceOptions = (frequencyData || []).map((e) => ({
    value: e.Occurence,
    label: e.Name,
  }));

  const manageSubCategory = useCallback(
    (categoryId) => {
      const model = [{ CmdType: "R" }];
      Api.manageSubCategory(model, "R", categoryId).then((resp) => {
        if (!resp.ok || resp.status !== 200) return;
        resp.json().then((rData) => {
          const subCatData = (rData || []).map((e) => ({
            SubCategoryId: e.SubCategoryId,
            CategoryId: e.CategoryId,
            SubCategoryName: e.SubCategoryName,
          }));
          setSubCategory(subCatData);
        });
      });
    },
    [Api],
  );

  const manageAssign = useCallback(() => {
    const model = [{ CmdType: "R", PropertyId: propertyId ? propertyId : 0 }];
    Api.manageAssign(model, "R").then((resp) => {
      if (!resp.ok || resp.status !== 200) return;
      resp.json().then((rData) => {
        const assignData = (rData || []).map((e) => ({
          assignId: e.Id,
          assignName: e.Name,
        }));
        setAssign(assignData);
      });
    });
  }, [Api, propertyId]);

  const manageProperties = useCallback(() => {
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

  const manageAssets = useCallback(
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
            lastServiceDate: a.LastServiceDate || null,
            nextServiceDate: a.NextServiceDate || null,
            assetPhoto: a.AssetImage || null,
            QRCode: a.QRCode || "",
          }));
          setAssets(list);
        });
      });
    },
    [Api],
  );

  const loadFrequency = useCallback(async () => {
    try {
      const data = await getFrequencyList(propertyId ? Number(propertyId) : null);
      setFrequencyData(data || []);
    } catch (error) {
      console.error("Error fetching frequency:", error);
      setFrequencyData([]);
    }
  }, [propertyId]);

  const loadShifts = useCallback(async () => {
    try {
      const data = await getShiftList(propertyId ? Number(propertyId) : null);
      setShifts(data || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setShifts([]);
    }
  }, [propertyId]);

  const populateAssetDetails = useCallback(
    (id) => {
      if (!id || !(assets || []).length) return;
      const selected = (assets || []).find((a) => String(a.assetId) === String(id));
      if (!selected) return;
      updateForm({
        assetBrand: selected.assetBrand || "",
        lastServiceDate: selected.lastServiceDate ? new Date(selected.lastServiceDate) : null,
        nextServiceDate: selected.nextServiceDate ? new Date(selected.nextServiceDate) : null,
        assetPhoto: selected.assetPhoto || null,
        QRCode: selected.QRCode || "",
      });
    },
    [assets, updateForm],
  );

  const onAssetChange = useCallback(
    (id) => {
      if (!id) {
        updateForm({
          assetId: "",
          assetBrand: "",
          lastServiceDate: null,
          nextServiceDate: null,
          assetPhoto: null,
          QRCode: "",
        });
        return;
      }
      updateForm({ assetId: id });
      populateAssetDetails(id);
    },
    [populateAssetDetails, updateForm],
  );

  useEffect(() => {
    if (selectedCategory) manageSubCategory(selectedCategory);
  }, [manageSubCategory, selectedCategory]);

  useEffect(() => {
    manageAssign();
    manageProperties();
    loadFrequency();
    loadShifts();
  }, [loadFrequency, loadShifts, manageAssign, manageProperties]);

  useEffect(() => {
    if (propertyId) manageAssets(propertyId);
  }, [manageAssets, propertyId]);

  useEffect(() => {
    if (assetId) populateAssetDetails(assetId);
  }, [assetId, populateAssetDetails]);

  return { subCategory, assign, propertyData, assets, shifts, occurrenceOptions, onAssetChange };
}
