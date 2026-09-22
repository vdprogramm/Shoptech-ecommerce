import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { notificationService, Notification } from "@/lib/api/api-notification";
import { authService } from "@/lib/api/api-auth";
import { Bell, CheckCircle2, ChevronRight, Package } from "lucide-react";

export const Route = createFileRoute("/_site/account/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authService.isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await notificationService.getHistory();
        setNotifications(data || []);
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)),
        );
      } catch (error) {
        console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
      }
    }

    if (notification.orderId) {
      navigate({ to: "/account/orders" });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return `Hôm qua`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <Bell className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Thông báo của bạn</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải thông báo...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-lg border border-dashed">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Không có thông báo nào</h3>
          <p className="text-sm text-muted-foreground mt-1">Bạn chưa có thông báo mới.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md flex items-start gap-4 ${
                !n.isRead ? "bg-primary/5 border-primary/20" : "bg-card"
              }`}
            >
              <div
                className={`mt-1 rounded-full p-2 ${!n.isRead ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {n.orderId ? <Package className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3
                    className={`font-semibold truncate ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {n.title}
                  </h3>
                  {!n.isRead && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      Mới
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${!n.isRead ? "text-foreground/90" : "text-muted-foreground"} mb-2`}
                >
                  {n.message}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDate(n.createdAt)}</span>
                  {n.isRead && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> Đã đọc
                    </span>
                  )}
                </div>
              </div>

              {n.orderId && (
                <div className="mt-2 text-muted-foreground shrink-0 self-center">
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
