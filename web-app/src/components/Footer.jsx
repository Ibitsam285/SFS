function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-4 mt-10">
      <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Secure File Sharing. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;