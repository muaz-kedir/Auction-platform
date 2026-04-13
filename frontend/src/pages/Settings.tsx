import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { User, Bell, Shield, CreditCard, Upload } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function Settings() {
  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>
            
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Input 
                  id="bio" 
                  defaultValue="Passionate collector and auction enthusiast"
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="font-semibold">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" defaultValue="123 Main Street" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" defaultValue="Los Angeles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" defaultValue="California" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" defaultValue="90001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" defaultValue="United States" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Bid Updates</p>
                  <p className="text-sm text-muted-foreground">Notify when you're outbid</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auction Endings</p>
                  <p className="text-sm text-muted-foreground">Alert before auction ends</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Auctions</p>
                  <p className="text-sm text-muted-foreground">Notify about relevant auctions</p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Confirmations</p>
                  <p className="text-sm text-muted-foreground">Transaction receipts and updates</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Promotional offers and news</p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Save Preferences</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Security Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Update Password</Button>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
            <div className="space-y-3">
              {[
                { device: "Chrome on MacBook Pro", location: "Los Angeles, CA", current: true },
                { device: "Safari on iPhone 14", location: "Los Angeles, CA", current: false },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                  <div>
                    <p className="font-medium">{session.device}</p>
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                  </div>
                  {session.current ? (
                    <Badge className="bg-secondary">Current</Badge>
                  ) : (
                    <Button variant="ghost" size="sm">Revoke</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Payment Methods</h2>

            <div className="space-y-3 mb-6">
              {[
                { type: "Visa", last4: "4242", exp: "12/25", default: true },
                { type: "Mastercard", last4: "8888", exp: "09/26", default: false },
              ].map((card, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{card.type} •••• {card.last4}</p>
                      <p className="text-sm text-muted-foreground">Expires {card.exp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.default && <Badge variant="outline">Default</Badge>}
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full">
              Add Payment Method
            </Button>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4">Billing Address</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billingAddress">Street Address</Label>
                <Input id="billingAddress" defaultValue="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCity">City</Label>
                  <Input id="billingCity" defaultValue="Los Angeles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingZip">ZIP Code</Label>
                  <Input id="billingZip" defaultValue="90001" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Save Address</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
