import { withAuth } from "next-auth/middleware";

const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default proxy;

export const config = {
  matcher: ["/inbox/:path*", "/today/:path*", "/upcoming/:path*", "/calendar/:path*", "/kanban/:path*", "/analytics/:path*", "/settings/:path*", "/projects/:path*"],
};
