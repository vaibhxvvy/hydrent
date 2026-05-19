"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { submitRentAction } from "@/app/submit/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { localities } from "@/lib/data/hyderabad";
import { formatINR } from "@/lib/utils";

export function SubmissionForm() {
  const [rent, setRent] = useState(45000);
  const [maintenance, setMaintenance] = useState(0);
  const effective = useMemo(() => rent + maintenance, [rent, maintenance]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a rent signal</CardTitle>
        <CardDescription>
          Public output is aggregated; proof files and personal details stay private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={submitRentAction} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="localitySlug">Locality</Label>
              <Select name="localitySlug" defaultValue="gachibowli">
                <SelectTrigger id="localitySlug">
                  <SelectValue placeholder="Choose locality" />
                </SelectTrigger>
                <SelectContent>
                  {localities.map((locality) => (
                    <SelectItem key={locality.slug} value={locality.slug}>
                      {locality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="microLocality">Micro-locality</Label>
              <Input id="microLocality" name="microLocality" placeholder="Telecom Nagar" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="bhk">BHK</Label>
              <Select name="bhk" defaultValue="2BHK">
                <SelectTrigger id="bhk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1RK", "1BHK", "2BHK", "3BHK", "4BHK"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rentType">Rent type</Label>
              <Select name="rentType" defaultValue="CLOSED">
                <SelectTrigger id="rentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOSED">Closed rent</SelectItem>
                  <SelectItem value="RENEWED">Renewed rent</SelectItem>
                  <SelectItem value="ASKING">Asking rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="furnishing">Furnishing</Label>
              <Select name="furnishing" defaultValue="SEMI_FURNISHED">
                <SelectTrigger id="furnishing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNFURNISHED">Unfurnished</SelectItem>
                  <SelectItem value="SEMI_FURNISHED">Semi furnished</SelectItem>
                  <SelectItem value="FULLY_FURNISHED">Fully furnished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="rentAmount">Monthly rent</Label>
              <Input
                id="rentAmount"
                name="rentAmount"
                type="number"
                min="1000"
                value={rent}
                onChange={(event) => setRent(Number(event.target.value))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maintenanceAmount">Maintenance</Label>
              <Input
                id="maintenanceAmount"
                name="maintenanceAmount"
                type="number"
                min="0"
                value={maintenance}
                onChange={(event) => setMaintenance(Number(event.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="securityDeposit">Security deposit</Label>
              <Input id="securityDeposit" name="securityDeposit" type="number" min="0" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="superBuiltUpAreaSqft">Super built-up sqft</Label>
              <Input id="superBuiltUpAreaSqft" name="superBuiltUpAreaSqft" type="number" min="100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="moveInDate">Move-in date</Label>
              <Input id="moveInDate" name="moveInDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="occupancyType">Occupancy</Label>
              <Select name="occupancyType" defaultValue="ANY">
                <SelectTrigger id="occupancyType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any</SelectItem>
                  <SelectItem value="FAMILY">Family</SelectItem>
                  <SelectItem value="BACHELOR">Bachelor</SelectItem>
                  <SelectItem value="SHARED">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <input type="hidden" name="maintenanceIncluded" value="false" />
          <input type="hidden" name="parkingCount" value="1" />
          <input type="hidden" name="brokerInvolved" value="false" />
          <input type="hidden" name="gatedSociety" value="true" />
          <input type="hidden" name="petFriendly" value="false" />

          <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Effective monthly cost</p>
              <p className="text-sm text-muted-foreground">Rent plus non-included maintenance</p>
            </div>
            <p className="font-mono text-xl font-semibold">{formatINR(effective)}</p>
          </div>

          <Button type="submit" className="w-full sm:w-fit">
            <Send className="size-4" aria-hidden="true" />
            Submit for verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
