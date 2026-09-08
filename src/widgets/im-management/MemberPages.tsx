import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { memberResource, friendResource } from "@/features/im/member-resources";
import { ResourcePage } from "@/widgets/resource-page/ResourcePage";

export function MemberPage() {
  const { groupID = "" } = useParams();
  const { t } = useTranslation();
  return (
    <>
      <Link className="back-link" to="/im/groups">
        <ArrowLeft size={15} />
        {t("management.back")}
      </Link>
      <p className="mono">{groupID}</p>
      <ResourcePage key={groupID} resource={memberResource(groupID)} />
    </>
  );
}
export function FriendPage() {
  const { userID = "" } = useParams();
  const { t } = useTranslation();
  return (
    <>
      <Link className="back-link" to="/im/users">
        <ArrowLeft size={15} />
        {t("management.back")}
      </Link>
      <p className="mono">{userID}</p>
      <ResourcePage key={userID} resource={friendResource(userID)} />
    </>
  );
}
