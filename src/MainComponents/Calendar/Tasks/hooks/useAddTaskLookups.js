import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ApiProvider from "../../DataProvider";
import { getFrequencyList } from "../../../../Services/masterService";

export default function useAddTaskLookups({ PropertyId, selectedCategory, updateForm }) {
  const apiRef = useRef(null);
  if (!apiRef.current) apiRef.current = new ApiProvider();
  const Api = apiRef.current;

  const [subCategory, setSubCategory] = useState([]);
  const [assign, setAssign] = useState([]);
  const [propertyData, setPropertyData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [assets, setAssets] = useState([]);

  const occurrenceOptions = useMemo(() => {
    return (frequencyData || []).map((e) => ({ value: e.Occurence, label: e.Name }));
  }, [frequencyData]);

  const loadSubCategory = useCallback(
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

  const loadAssign = useCallback(() => {
    const model = [{ CmdType: "R", PropertyId: PropertyId ? PropertyId : 0 }];
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
  }, [Api, PropertyId]);

  const loadProperties = useCallback(() => {
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

  const loadFrequency = useCallback(async () => {
    try {
      const data = await getFrequencyList();
      setFrequencyData(data || []);
    } catch (error) {
      console.error("Error fetching frequency:", error);
    }
  }, []);

  const loadAssets = useCallback(async (propertyId) => {
    if (!propertyId) return;
    try {
      const res = await fetch(`https://api.urest.in:8096/GetAssets?propertyId=${propertyId}`);
      const data = await res.json();
      const combined = [
        ...(Array.isArray(data.PassedServiceDates) ? data.PassedServiceDates : []),
        ...(Array.isArray(data.UpcomingServiceDates) ? data.UpcomingServiceDates : []),
      ].map((a) => ({
        assetId: a.Id,
        assetName: a.Name,
        Manufacturer: a.Manufacturer,
        LastServiceDate: a.LastServiceDate,
        NextServiceDate: a.NextServiceDate,
        AssetImage: a.AssetImage,
        QRCode: a.QRCode,
      }));
      setAssets(combined);
    } catch (err) {
      console.error("Failed to load assets", err);
      setAssets([]);
    }
  }, []);

  const onAssetChange = useCallback(
    (assetId) => {
      const selectedAsset = (assets || []).find((a) => String(a.assetId) === String(assetId));
      if (!selectedAsset) {
        updateForm({
          assetId: "",
          assetBrand: "",
          assetPhoto: null,
          lastServiceDate: null,
          nextServiceDate: null,
          QRCode: "",
        });
        return;
      }
      updateForm({
        assetId,
        assetBrand: selectedAsset.Manufacturer || "",
        lastServiceDate: selectedAsset.LastServiceDate ? new Date(selectedAsset.LastServiceDate) : null,
        nextServiceDate: selectedAsset.NextServiceDate ? new Date(selectedAsset.NextServiceDate) : null,
        assetPhoto: selectedAsset.AssetImage || null,
        QRCode: selectedAsset.QRCode || "",
      });
    },
    [assets, updateForm],
  );

  useEffect(() => {
    loadAssign();
    loadAssets(PropertyId);
  }, [PropertyId, loadAssign, loadAssets]);

  useEffect(() => {
    loadProperties();
    loadFrequency();
  }, [loadFrequency, loadProperties]);

  useEffect(() => {
    if (selectedCategory) loadSubCategory(selectedCategory);
  }, [loadSubCategory, selectedCategory]);

  return { subCategory, assign, propertyData, assets, occurrenceOptions, onAssetChange };
}

