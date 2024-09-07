import { asynchandler } from "../utils/async_handlers.js";

const registerUser = asynchandler(async (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});

export { registerUser };
