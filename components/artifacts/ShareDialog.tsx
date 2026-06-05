type ShareDialogProps = {
  route: string;
};

export function ShareDialog({ route }: ShareDialogProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      Share link placeholder: {route}
    </div>
  );
}
