"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBranding } from "@/contexts/BrandingContext";
import { Image as ImageIcon, Settings } from "lucide-react";
import { useState } from "react";

const brandingFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(50, "Company name is too long"),
  logoUrl: z.string().url("Please enter a valid URL for the logo").or(z.literal("")),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export function BrandingModal() {
  const { brandingConfig, setBrandingConfig } = useBranding();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: brandingConfig,
  });

  const onSubmit = (data: BrandingFormValues) => {
    setBrandingConfig(data);
    setIsOpen(false);
  };
  
  // Sync form default values if brandingConfig changes externally
  React.useEffect(() => {
    form.reset(brandingConfig);
  }, [brandingConfig, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="w-9 h-9">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Customize Branding</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Branding</DialogTitle>
          <DialogDescription>
            Set your company name and logo. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company LLC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
