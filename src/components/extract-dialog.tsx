"use client"

import { useState } from "react"
import { FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Checkbox } from "./ui/checkbox"

interface ExtractDialogProps {
  isOpen: boolean
  onClose: () => void
  currentArchive: string | null
}

export function ExtractDialog({ isOpen, onClose, currentArchive }: ExtractDialogProps) {
  const [extractPath, setExtractPath] = useState(() => {
    return window.electron.fs.getUserHome()
  })
  const [extractOption, setExtractOption] = useState("current")

  const handleBrowse = async () => {
    const selectedPath = await window.electron.dialog.openDirectory()
    if (selectedPath) {
      setExtractPath(selectedPath)
    }
  }

  const handleExtract = () => {
    // In a real app, this would trigger the extraction process
    console.log("Extracting", currentArchive, "to", extractPath)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Extract Archive</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {currentArchive && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="archive" className="text-right">
                Archive:
              </Label>
              <div className="col-span-3">
                <Input id="archive" value={currentArchive} readOnly />
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
              Destination:
            </Label>
            <div className="col-span-3 flex">
              <Input
                id="destination"
                value={extractPath}
                onChange={(e) => setExtractPath(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" className="ml-2" onClick={handleBrowse}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Extract Options:</Label>
            <div className="col-span-3">
              <RadioGroup value={extractOption} onValueChange={setExtractOption} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="option-current" />
                  <Label htmlFor="option-current">Extract to current folder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="subfolder" id="option-subfolder" />
                  <Label htmlFor="option-subfolder">Extract to subfolder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="option-custom" />
                  <Label htmlFor="option-custom">Extract to specified path</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Options:</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="overwrite" />
                <Label htmlFor="overwrite">Overwrite existing files</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="keep-structure" defaultChecked />
                <Label htmlFor="keep-structure">Keep folder structure</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="show-progress" defaultChecked />
                <Label htmlFor="show-progress">Show progress dialog</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExtract}>Extract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

