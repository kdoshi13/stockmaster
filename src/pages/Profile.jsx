import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Profile = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSave = () => {
    console.log("Saving profile changes...");
  };

  const handlePasswordChange = () => {
    console.log("Password updated...");
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
      <p className="text-muted-foreground -mt-3">
        View and update your personal information
      </p>

      {/* User Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Avatar + Basic Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{name || "User"}</p>
              <p className="text-muted-foreground text-sm">{email}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input
                value={email}
                type="email"
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>

        </CardContent>
      </Card>

      {/* Password Update */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Current Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Current password"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
          </div>

          <Button variant="secondary" onClick={handlePasswordChange} className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Update Password
          </Button>

        </CardContent>
      </Card>

    </div>
  );
};

export default Profile;
