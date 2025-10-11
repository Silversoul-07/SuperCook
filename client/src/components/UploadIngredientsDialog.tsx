import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'

type Props = {
  onAdd: (name: string) => void
}

export function UploadIngredientsDialog({ onAdd }: Props) {
  const [open, setOpen] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [index, setIndex] = React.useState(0)
  const [recognized, setRecognized] = React.useState<string | null>(null)

  function handleFiles(flist: FileList | null) {
    if (!flist) return
    setFiles(Array.from(flist))
    setIndex(0)
    setRecognized(null)
  }

  function recognize(file: File) {
    // Mock recognition: use file name (strip extension) and replace dashes/underscores
    const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    // simple cleanup: keep only first word as ingredient candidate
    const candidate = name.split(/\s+/)[0]
    return candidate.charAt(0).toUpperCase() + candidate.slice(1)
  }

  function onNext() {
    const next = index + 1
    if (next < files.length) {
      setIndex(next)
      setRecognized(null)
    } else {
      // finished
      setOpen(false)
    }
  }

  function onRecognizeNow() {
    const f = files[index]
    if (!f) return
    const r = recognize(f)
    setRecognized(r)
  }

  function onAccept() {
    if (!recognized) return
    onAdd(recognized)
    onNext()
  }

  function onSkip() {
    onNext()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white">Upload images</button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload ingredient images</DialogTitle>
          <DialogDescription>Upload one or more photos. The app will try to recognize an ingredient name from each image (mocked).</DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-4">
          <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />

          {files.length === 0 && <p className="text-sm text-muted-foreground">No images selected yet.</p>}

          {files.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <img src={URL.createObjectURL(files[index])} alt="preview" className="max-h-48 rounded-md object-contain" />
              <p className="text-sm text-muted-foreground">Image {index + 1} of {files.length}</p>

              <div className="flex items-center gap-2">
                <button onClick={onRecognizeNow} className="rounded-md bg-primary px-3 py-1 text-sm text-white">Recognize</button>
                <button onClick={onSkip} className="rounded-md border px-3 py-1 text-sm">Skip</button>
              </div>

              {recognized && (
                <div className="mt-2 w-full rounded-md border p-3">
                  <p className="text-sm">Recognized ingredient:</p>
                  <h3 className="text-lg font-medium">{recognized}</h3>
                  <div className="mt-3 flex gap-2">
                    <button onClick={onAccept} className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white">Accept</button>
                    <button onClick={onNext} className="rounded-md border px-3 py-1 text-sm">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button className="rounded-md border px-3 py-1 text-sm">Close</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UploadIngredientsDialog
