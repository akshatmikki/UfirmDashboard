import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import * as appCommon from "../../Common/AppCommon.js";
import ApiProvider from "../Calendar/DataProvider";
import { MasterConfigCommon } from "../../ReactComponents/MasterConfig";
import { createMasterConfigContext, createMasterConfigTabs } from "./masterConfigStructure";

export default function MasterConfig() {
  const api = useMemo(() => new ApiProvider(), []);
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const userId = useSelector((state) => state.Commonreducer.userId);
  const selectedPropertyId = Number(propertyId) > 0 ? Number(propertyId) : null;
  const selectedUserId = Number(userId) > 0 ? Number(userId) : 1;

  const context = useMemo(
    () => createMasterConfigContext({ api, selectedPropertyId, selectedUserId }),
    [api, selectedPropertyId, selectedUserId]
  );

  const tabs = useMemo(() => createMasterConfigTabs(), []);

  return (
    <MasterConfigCommon
      title="Master Configuration"
      context={context}
      tabs={tabs}
      notify={({ type, message }) => {
        const t = type === "error" ? "error" : type === "warning" ? "warning" : type === "success" ? "success" : "info";
        appCommon.showtextalert(message, "", t);
      }}
    />
  );
}
