import React from "react";

const NotificationButton = ({ count = 0, type, onClick = () => {} }) => {
    const getIconClass = () => {
        switch (type) {
            case "asset":
                return "fas fa-tools"; // crossed tools
            case "complaint":
                return "far fa-bell"; // outline bell
            default:
                return "far fa-check-square"; // outline checkbox with tick
        }
    };

    return (
        <div className="nav-item ufirm-topbar-icon">
            <a
                href="#"
                className="nav-link dropdown-notification-link ufirm-topbar-icon-link"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(e);
                }}
                role="button"
                aria-label={`You have ${count} new notifications`}
            >
                <i className={`notification-icon notification-icon-${type} ${getIconClass()}`} aria-hidden="true"></i>
                {count > 0 && (
                    <span
                        className={`navbar-badge ufirm-topbar-badge ufirm-badge-${type}`}
                    >
                        {count}
                    </span>
                )}
            </a>
        </div>
    );
};

export default NotificationButton;
