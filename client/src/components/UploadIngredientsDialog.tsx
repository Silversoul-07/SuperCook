import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { UploadIcon } from 'lucide-react'

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

  async function detectIngredient(file: File): Promise<string | null> {
    const apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY;
    if (!apiKey) {
      console.warn("ROBOFLOW_API_KEY is not set. Using mock recognition.")
      return recognize(file)
    }
    const url = "https://serverless.roboflow.com/food-ingredients-dataset/3"

    try {
      const base64Image = await fileToBase64(file)
      const response = await fetch(`${url}?api_key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: base64Image,
      })

      if (!response.ok) {
        console.error("Failed to detect ingredient:", response.statusText)
        return null
      }

      const data = await response.json()
      console.log("Detection response:", data)

      // Extract the most confident prediction
      type Prediction = { confidence: number; class: string }
      const predictions: Prediction[] = data.predictions || []
      if (predictions.length > 0) {
        const topPrediction = predictions.reduce(
          (best: Prediction, current: Prediction) =>
            current.confidence > best.confidence ? current : best
        )
        return topPrediction.class // Return the detected class (ingredient name)
      }

      return null
    } catch (error) {
      console.error("Error during ingredient detection:", error)
      return null
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1] // Extract base64 content
        resolve(base64String)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  async function onRecognizeNow() {
    const f = files[index]
    if (!f) return
    const detectedIngredient = await detectIngredient(f)
    if (detectedIngredient) {
      setRecognized(detectedIngredient)
    } else {
      console.warn("No ingredient detected.")
    }
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
       <UploadIcon className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground" />
          
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
