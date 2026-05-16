import React, { useEffect, useState } from "react";
import NotificationButton from "./NotificationButton";
import NotificationList from "./NotificationList";
import { connect } from "react-redux";
import {
  fetchNotifications,
  fetchAssetServiceNotifications,
  TASK_NOTIFICATION_REFRESH_EVENT,
} from "../../Services/notificationService";

const NOTIFICATION_TYPES = ["task", "asset", "complaint"];

const Notification = ({ propId }) => {
  const [dataMap, setDataMap] = useState({
    task: [],
    asset: [],
    complaint: [],
  });
  const [showType, setShowType] = useState(null);

  const loadNotification = async (type) => {
    if (!propId || propId === 0) {
      console.warn(`Property ID is invalid: ${propId}. Skipping ${type} notification load.`);
      return [];
    }

    try {
      let data = [];

      if (type === "asset") {
        // ✅ API already returns merged array (Upcoming + Overdue)
        const response = await fetchAssetServiceNotifications(propId);
        data = Array.isArray(response) ? response : [];
      } else {
        // Fetch task or complaint notifications normally
        const response = await fetchNotifications(type, propId);
        data = Array.isArray(response) ? response : [];
      }

      setDataMap((prev) => ({ ...prev, [type]: data }));
      return data;
    } catch (error) {
      console.error(`Error loading ${type} notifications:`, error);
      setDataMap((prev) => ({ ...prev, [type]: [] }));
      return [];
    }
  };

  // ✅ Load notifications whenever propId changes
  useEffect(() => {
    if (propId && propId !== 0) {
      NOTIFICATION_TYPES.forEach((type) => loadNotification(type));
    } else {
      console.warn("Property ID is not set or invalid:", propId);
    }
  }, [propId]);

  useEffect(() => {
    const onTaskRefresh = () => {
      NOTIFICATION_TYPES.forEach((type) => loadNotification(type));
    };
    window.addEventListener(TASK_NOTIFICATION_REFRESH_EVENT, onTaskRefresh);
    return () => window.removeEventListener(TASK_NOTIFICATION_REFRESH_EVENT, onTaskRefresh);
  }, [propId]);

  const handleShowList = async (type) => {
    setShowType((prev) => (prev === type ? null : type));
    await loadNotification(type);
  };

  return (
    <>
      {NOTIFICATION_TYPES.map((type) => {
        // ✅ For asset, calculate special counts
        let count = dataMap[type].length;

        if (type === "asset" && Array.isArray(dataMap.asset)) {
          const overdueCount = dataMap.asset.filter(a => a.ServiceStatus === "Overdue").length;
          const upcomingCount = dataMap.asset.filter(a => a.ServiceStatus === "Upcoming").length;

          // Optional: You can log or display separately if needed
          console.log(`Asset Notifications — Upcoming: ${upcomingCount}, Overdue: ${overdueCount}`);

          // Example 1️⃣: Total count (shows all)
          count = overdueCount + upcomingCount;

          // Example 2️⃣: If you only want to show overdue ones as notifications:
          // count = overdueCount;
        }

        return (
          <NotificationButton
            key={type}
            count={count}
            type={type}
            onClick={() => handleShowList(type)}
          />
        );
      })}

      {showType && (
        <NotificationList
          type={showType}
          nList={dataMap[showType]}
          apiCall={() => loadNotification(showType)}
        />
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  propId: state.Commonreducer.puidn,
});

export default connect(mapStateToProps)(Notification);
