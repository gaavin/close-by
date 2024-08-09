import { Form } from "@remix-run/react";
import { Input } from "~/components/ui/input";

export default function Login() {
    return (
        <Form className="grid grid-rows-2 grid-cols-1 gap-4 p-4" action="" method="POST">
            <Input placeholder="Username" name="username" />
            <Input placeholder="Password" type="password" name="password" />
        </Form>
    )
}