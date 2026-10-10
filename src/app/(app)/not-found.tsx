import { ButtonLink, Empty } from "@/components/ui";

export default function NotFound() {
  return (
    <Empty action={<ButtonLink href="/">Back to search</ButtonLink>}>
      This entry doesn&apos;t exist. It may have been deleted.
    </Empty>
  );
}
