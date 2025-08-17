"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/app/context/AppContext";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import clsx from "clsx";
import {
  Question,
  questionCategories,
  vehicleCategories,
} from "@/constants/getdata";
interface DisplayQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  image: string;
}

interface AnsweredQuestion {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  shuffledOptions: string[];
}

const ExamPage: React.FC = () => {
  const {
    showWhitePanel,
    setShowWhitePanel,
    selectedVehicleType,
    setSelectedVehicleType,
    isClientLoaded,
  } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedVehicle = localStorage.getItem("selectedVehicleType");
      return savedVehicle || selectedVehicleType || "B, B1";
    }
    return "B, B1";
  });
  const [isSelectActive, setIsSelectActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryCheckboxes, setCategoryCheckboxes] = useState<boolean[]>(
    Array(questionCategories.length).fill(true)
  );
  const [allQuestions, setAllQuestions] = useState<DisplayQuestion[]>([]);
  const [shuffledQuestionOrder, setShuffledQuestionOrder] = useState<number[]>(
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shownQuestionIds, setShownQuestionIds] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<DisplayQuestion | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [timer, setTimer] = useState<number>(1800);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState<number>(0);
  const [showFailModal, setShowFailModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [autoNext, setAutoNext] = useState<boolean>(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);

  // Ref master checkbox-ისთვის
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      showWhitePanel &&
      timer > 0 &&
      !showFailModal &&
      !showSuccessModal &&
      allQuestions.length > 0
    ) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (
      timer === 0 &&
      showWhitePanel &&
      !showFailModal &&
      !showSuccessModal &&
      allQuestions.length > 0
    ) {
      setShowFailModal(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWhitePanel, timer, showFailModal, showSuccessModal, allQuestions]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (selectedVehicleType && selectedVehicleType !== selectedCategory) {
      setSelectedCategory(selectedVehicleType);
      setCategoryCheckboxes(Array(questionCategories.length).fill(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleType]);

  useEffect(() => {
    if (showWhitePanel && isClientLoaded) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, showWhitePanel, categoryCheckboxes, isClientLoaded]);

  useEffect(() => {
    if (showWhitePanel) {
      document.body.classList.add("overflow-hidden");
      setTimer(1800);
      setCorrectAnswersCount(0);
      setIncorrectAnswersCount(0);
      setShowFailModal(false);
      setShowSuccessModal(false);
      setAnsweredQuestions([]);
    } else {
      document.body.classList.remove("overflow-hidden");
      setAllQuestions([]);
      setShuffledQuestionOrder([]);
      setShownQuestionIds([]);
      setCurrentQuestion(null);
      setShuffledOptions([]);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setIsAnswerCorrect(null);
      setCurrentQuestionIndex(0);
      setCorrectAnswersCount(0);
      setIncorrectAnswersCount(0);
      setShowFailModal(false);
      setShowSuccessModal(false);
      setCategoryCheckboxes(Array(questionCategories.length).fill(true));
      setAnsweredQuestions([]);
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showWhitePanel]);

  useEffect(() => {
    if (currentQuestion && currentQuestion.options) {
      const existingAnswer = answeredQuestions.find(
        (ans) => ans.questionId === currentQuestion.id
      );
      if (existingAnswer) {
        setShuffledOptions(existingAnswer.shuffledOptions);
        setSelectedAnswer(existingAnswer.selectedAnswer);
        setAnswerSubmitted(true);
        setIsAnswerCorrect(existingAnswer.isCorrect);
      } else {
        setShuffledOptions(shuffleArray(currentQuestion.options));
        setAnswerSubmitted(false);
        setIsAnswerCorrect(null);
        setSelectedAnswer(null);
      }
    } else {
      setShuffledOptions([]);
    }
  }, [currentQuestion, answeredQuestions]);

  useEffect(() => {
    if (
      allQuestions.length === 30 &&
      answeredQuestions.length === allQuestions.length
    ) {
      if (
        correctAnswersCount === 30 ||
        (correctAnswersCount === 29 && incorrectAnswersCount === 1) ||
        (correctAnswersCount === 28 && incorrectAnswersCount === 2) ||
        (correctAnswersCount === 27 && incorrectAnswersCount === 3)
      ) {
        setShowSuccessModal(true);
      }
    }
  }, [
    correctAnswersCount,
    incorrectAnswersCount,
    answeredQuestions,
    allQuestions,
  ]);

  useEffect(() => {}, [categoryCheckboxes]);

  const selectedVehicle = vehicleCategories.find(
    (category) => category.label === selectedCategory
  );
  const selectedGadjet = selectedVehicle?.gadjet || "";

  const loadQuestions = () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!selectedVehicle) {
        setAllQuestions([]);
        setCurrentQuestion(null);
        setShuffledQuestionOrder([]);
        setShownQuestionIds([]);
        setErrorMessage("არჩეული კატეგორია არ მოიძებნა!");
        setLoading(false);
        return;
      }

      if (!selectedVehicle.categoryMappings) {
        setAllQuestions([]);
        setCurrentQuestion(null);
        setShuffledQuestionOrder([]);
        setShownQuestionIds([]);
        setErrorMessage("კითხვების კატეგორიები არ მოიძებნა!");
        setLoading(false);
        return;
      }

      const selectedCategoryIndices = categoryCheckboxes
        .map((checked, index) => (checked ? index : -1))
        .filter((index) => index !== -1);

      const rawQuestions: Question[] = [];
      selectedCategoryIndices.forEach((index) => {
        const category = questionCategories[index];
        if (!category) {
          return;
        }
        const categoryQuestions =
          selectedVehicle.categoryMappings[category.name]?.questions || [];
        rawQuestions.push(...categoryQuestions);
      });

      if (rawQuestions.length === 0) {
        setAllQuestions([]);
        setCurrentQuestion(null);
        setShuffledQuestionOrder([]);
        setShownQuestionIds([]);
        setErrorMessage("არჩეული კატეგორიისთვის კითხვები არ მოიძებნა!");
        setLoading(false);
        return;
      }

      const questions: DisplayQuestion[] = rawQuestions
        .map((raw) => {
          if (!raw || !raw._id || !raw.desc || !raw.answers) {
            return null;
          }
          return {
            id: raw._id.toString(),
            text: raw.desc,
            options: raw.answers.map((answer) => answer?.text || ""),
            correctAnswer:
              raw.answers.find((answer) => answer?.isCorrect)?.text || "",
            image: raw.image || "",
          };
        })
        .filter((q): q is DisplayQuestion => q !== null);

      let finalQuestions = questions;
      if (selectedCategory === "B, B1") {
        const shuffledQuestions = shuffleArray(questions);
        finalQuestions = shuffledQuestions.slice(0, 30);
      } else if (selectedCategory === "C") {
        const shuffledQuestions = shuffleArray(questions);
        finalQuestions = shuffledQuestions.slice(0, 40);
      } else if (selectedCategory === "D") {
        const shuffledQuestions = shuffleArray(questions);
        finalQuestions = shuffledQuestions.slice(0, 40);
      } else if (selectedCategory === "T,S") {
        const shuffledQuestions = shuffleArray(questions);
        finalQuestions = shuffledQuestions.slice(0, 30);
      } else {
        finalQuestions = shuffleArray(questions);
      }

      const questionIndices = Array.from(
        { length: finalQuestions.length },
        (_, i) => i
      );
      const shuffledIndices = shuffleArray(questionIndices);

      setAllQuestions(finalQuestions);
      setShuffledQuestionOrder(shuffledIndices);
      setCurrentQuestionIndex(0);
      if (finalQuestions.length > 0) {
        setCurrentQuestion(finalQuestions[shuffledIndices[0]]);
        setShownQuestionIds([finalQuestions[shuffledIndices[0]].id]);
      } else {
        setCurrentQuestion(null);
        setShuffledQuestionOrder([]);
        setShownQuestionIds([]);
        setErrorMessage("ვერ მოხერხდა კითხვების ჩატვირთვა!");
      }
    } catch (error) {
      console.error("loadQuestions: კითხვების ჩატვირთვისას შეცდომა:", error);
      setAllQuestions([]);
      setCurrentQuestion(null);
      setShuffledQuestionOrder([]);
      setShownQuestionIds([]);
      setErrorMessage("შეცდომა კითხვების ჩატვირთვისას!");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    if (selectedCategory === "D") {
      const anyChecked = categoryCheckboxes.some((checked) => checked);
      if (!anyChecked) {
        setErrorMessage("გთხოვთ, აირჩიოთ მინიმუმ ერთი კატეგორია!");
        return;
      }
    }

    setShowWhitePanel(true);
    setCurrentQuestionIndex(0);
    setShownQuestionIds([]);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setIsAnswerCorrect(null);
    setErrorMessage(null);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setShowFailModal(false);
    setShowSuccessModal(false);
    setAutoNext(false);
    setAnsweredQuestions([]);
    loadQuestions();
  };

  const handleRestartExam = () => {
    setCurrentQuestionIndex(0);
    setShownQuestionIds([]);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setIsAnswerCorrect(null);
    setErrorMessage(null);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setShowFailModal(false);
    setShowSuccessModal(false);
    setTimer(1800);
    setAutoNext(false);
    setAnsweredQuestions([]);
    loadQuestions();
  };

  const handleAnswerClick = (option: string) => {
    if (answerSubmitted) return;

    setSelectedAnswer(option);
    setAnswerSubmitted(true);
    const isCorrect = option === currentQuestion?.correctAnswer;
    setIsAnswerCorrect(isCorrect);

    if (currentQuestion) {
      setAnsweredQuestions((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          selectedAnswer: option,
          isCorrect,
          shuffledOptions: [...shuffledOptions],
        },
      ]);
    }

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      setIncorrectAnswersCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 4) {
          setShowFailModal(true);
        }
        return newCount;
      });
    }

    if (autoNext && currentQuestionIndex < allQuestions.length - 1) {
      setTimeout(() => {
        handleQuestionNavigation(currentQuestionIndex + 1);
      }, 1000);
    }
  };

  const handleQuestionNavigation = (displayIndex: number) => {
    if (displayIndex >= 0 && displayIndex < allQuestions.length) {
      setCurrentQuestionIndex(displayIndex);
      const actualIndex = shuffledQuestionOrder[displayIndex];
      setCurrentQuestion(allQuestions[actualIndex]);
      setShownQuestionIds((prev) => {
        if (!prev.includes(allQuestions[actualIndex].id)) {
          return [...prev, allQuestions[actualIndex].id];
        }
        return prev;
      });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      handleQuestionNavigation(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (answerSubmitted && currentQuestionIndex < allQuestions.length - 1) {
      handleQuestionNavigation(currentQuestionIndex + 1);
    }
  };

  const handleSelectOpen = () => setIsSelectActive(true);
  const handleSelectClose = () => setIsSelectActive(false);

  const handleMasterCheckboxChange = (checked: boolean) => {
    setCategoryCheckboxes(Array(questionCategories.length).fill(checked));
  };

  const handleCategoryCheckboxChange = (index: number, checked: boolean) => {
    const updatedCheckboxes = [...categoryCheckboxes];
    updatedCheckboxes[index] = checked;
    setCategoryCheckboxes(updatedCheckboxes);
  };

  const handleCloseExam = () => {
    setShowWhitePanel(false);
    setCategoryCheckboxes(Array(questionCategories.length).fill(true));
    localStorage.setItem("showWhitePanel", JSON.stringify(false));
    setErrorMessage(null);
    setAnsweredQuestions([]);
  };

  const masterChecked = categoryCheckboxes.every((checked) => checked);
  const masterIndeterminate =
    categoryCheckboxes.some((checked) => checked) && !masterChecked;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = masterIndeterminate;
    }
  }, [masterIndeterminate]);

  const vehicleCounts = questionCategories.map((category) => {
    const questionsInCategory =
      selectedVehicle?.categoryMappings?.[category.name]?.questions || [];
    return questionsInCategory.length;
  });

  const totalVehicles = vehicleCounts.reduce((sum, count) => sum + count, 0);

  const checkedVehicles = questionCategories.reduce(
    (count, category, index) => {
      if (categoryCheckboxes[index]) {
        const questionsInCategory =
          selectedVehicle?.categoryMappings?.[category.name]?.questions || [];
        return count + questionsInCategory.length;
      }
      return count;
    },
    0
  );

  if (!isClientLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-2 sm:p-4 md:p-5 transition-colors duration-300">
      <div className="w-full max-w-6xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <Button
            variant="default"
            className="px-4 sm:px-6 md:px-10 font-bold text-sm sm:text-base md:text-lg bg-green-500 hover:bg-green-600"
            onClick={handleStartExam}
          >
            გამოცდის დაწყება
          </Button>
        </div>

        <Select
          value={selectedCategory}
          onValueChange={(value) => {
            setLoading(true);
            setSelectedCategory(value);
            setSelectedVehicleType(value);
            setCategoryCheckboxes(Array(questionCategories.length).fill(true));
            setAllQuestions([]);
            setCurrentQuestion(null);
            setShuffledQuestionOrder([]);
            setShownQuestionIds([]);
            setErrorMessage(null);
            setAnsweredQuestions([]);
            setTimeout(() => setLoading(false), 500);
          }}
          onOpenChange={(open) =>
            open ? handleSelectOpen() : handleSelectClose()
          }
        >
          <SelectTrigger
            className={`w-full border-none rounded-md p-3 sm:p-4 md:p-6 text-sm sm:text-base md:text-xl focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-300 select-none ${
              isSelectActive
                ? "bg-green-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            <SelectValue placeholder="აირჩიეთ კატეგორია">
              <div className="flex items-center">
                <Image
                  src={
                    vehicleCategories.find(
                      (category) => category.label === selectedCategory
                    )?.icon || ""
                  }
                  alt="სატრანსპორტო საშუალების ხატულა"
                  width={6}
                  height={6}
                  className="mr-2 sm:mr-3 md:mr-4 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                />
                <span>{selectedCategory}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
            {vehicleCategories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.label}
                className="flex items-center p-2 sm:p-3 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer text-xs sm:text-sm md:text-lg transition-colors duration-300"
              >
                <div className="flex items-center">
                  <Image
                    src={category.icon}
                    alt={`${category.label} ხატულა`}
                    width={8}
                    height={8}
                    className="mr-1 sm:mr-2 md:mr-3 w-8 h-8 sm:w-10 sm:h-10 md:w-[45px] md:h-[45px]"
                  />
                  <span>{category.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errorMessage && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-100 text-red-700 rounded-md text-sm sm:text-base">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center mt-4 sm:mt-10">
            <div className="flex items-center space-x-2">
              <svg
                className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-gray-700 text-sm sm:text-lg">
                იტვირთება...
              </span>
            </div>
          </div>
        ) : (
          <Card className="w-full mt-3 sm:mt-4 md:mt-5">
            <CardContent className="pt-3 sm:pt-4 md:pt-6">
              <div className="flex justify-center items-center mb-2 sm:mb-3 md:mb-4 space-x-3 sm:space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    ref={masterCheckboxRef}
                    checked={masterChecked}
                    onChange={(e) =>
                      handleMasterCheckboxChange(e.target.checked)
                    }
                    className="mr-1 sm:mr-2 border-green-500 accent-green-500 focus:ring-green-500 w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span className="text-gray-700 font-semibold text-xs sm:text-sm md:text-base">
                    ყველას მონიშვნა/მოხსნა
                  </span>
                </div>
                <span className="text-green-500 font-semibold text-xs sm:text-sm md:text-base">
                  {checkedVehicles}/{totalVehicles} {selectedGadjet}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1">
                  {questionCategories
                    .slice(0, Math.ceil(questionCategories.length / 2))
                    .map((category, index) => (
                      <div
                        key={category.id}
                        className="flex items-center mb-1 sm:mb-2"
                      >
                        <input
                          type="checkbox"
                          checked={categoryCheckboxes[index]}
                          onChange={(e) =>
                            handleCategoryCheckboxChange(
                              index,
                              e.target.checked
                            )
                          }
                          className="mr-1 sm:mr-2 border-green-500 accent-green-500 focus:ring-green-500 w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <span className="text-gray-700 text-xs sm:text-sm md:text-base break-words">
                          {category.name} ({vehicleCounts[index]})
                        </span>
                      </div>
                    ))}
                </div>
                <div className="flex-1">
                  {questionCategories
                    .slice(Math.ceil(questionCategories.length / 2))
                    .map((category, index) => (
                      <div
                        key={category.id}
                        className="flex items-center mb-1 sm:mb-2"
                      >
                        <input
                          type="checkbox"
                          checked={
                            categoryCheckboxes[
                              index + Math.ceil(questionCategories.length / 2)
                            ]
                          }
                          onChange={(e) =>
                            handleCategoryCheckboxChange(
                              index + Math.ceil(questionCategories.length / 2),
                              e.target.checked
                            )
                          }
                          className="mr-1 sm:mr-2 border-green-500 accent-green-500 focus:ring-green-500 w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <span className="text-gray-700 text-xs sm:text-sm md:text-base break-words">
                          {category.name} (
                          {
                            vehicleCounts[
                              index + Math.ceil(questionCategories.length / 2)
                            ]
                          }
                          )
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showWhitePanel && (
          <div className="fixed inset-0 bg-gray-800 z-50">
            <table className="fixed top-0 left-0 w-full bg-gray-800 font-medium text-white p-1 sm:p-2 z-60 table-fixed border-white">
              <thead>
                <tr>
                  <td className="text-sm sm:text-base md:text-lg text-yellow-200 px-2 sm:px-3 md:px-4 py-1 sm:py-2 w-[16.67%] border-2 border-white text-center">
                    {formatTimer(timer)}
                  </td>
                  <td className="text-sm sm:text-base md:text-lg text-yellow-500 px-2 sm:px-3 md:px-4 py-1 sm:py-2 w-[16.67%] border-2 border-white text-center">
                    {currentQuestionIndex + 1}/{allQuestions.length}
                  </td>
                  <td className="text-sm sm:text-base md:text-lg text-green-500 px-2 sm:px-3 md:px-4 py-1 sm:py-2 w-[16.67%] border-2 border-white text-center">
                    {correctAnswersCount}
                  </td>
                  <td className="text-sm sm:text-base md:text-lg text-red-500 px-2 sm:px-3 md:px-4 py-1 sm:py-2 w-[16.67%] border-2 border-white text-center">
                    {incorrectAnswersCount}/3
                  </td>
                  <td className="text-sm sm:text-base md:text-lg text-yellow-500 px-2 sm:px-3 md:px-4 py-1 sm:py-2 w-[16.67%] border-2 border-white text-center">
                    #{currentQuestion ? currentQuestion.id : "-"}
                  </td>
                  <td className="text-sm sm:text-base md:text-lg text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 w-[16.67%] border-2 border-white text-center">
                    <Button
                      variant="grey"
                      className=""
                      onClick={handleCloseExam}
                    >
                      <X className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-200" />
                    </Button>
                  </td>
                </tr>
              </thead>
            </table>

            {showFailModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                <div className="bg-white p-4 sm:p-6 rounded-md shadow-lg flex flex-col items-center max-w-xs sm:max-w-sm md:max-w-md w-full">
                  <p className="text-lg sm:text-xl font-semibold text-red-600 mb-3 sm:mb-4">
                    ვერ ჩააბარე
                  </p>
                  <Button
                    variant="default"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 text-sm sm:text-base"
                    onClick={handleRestartExam}
                  >
                    ახლიდან დაწყება
                  </Button>
                </div>
              </div>
            )}

            {showSuccessModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
                <div className="bg-white p-4 sm:p-6 rounded-md shadow-lg flex flex-col items-center max-w-xs sm:max-w-sm md:max-w-md w-full">
                  <p className="text-lg sm:text-xl font-semibold text-green-600 mb-3 sm:mb-4 text-center">
                    თქვენ წარმატებით ჩააბარეთ, გისურვებთ წარმატებებს!
                  </p>
                  <Button
                    variant="default"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 text-sm sm:text-base"
                    onClick={handleRestartExam}
                  >
                    ახლიდან დაწყება
                  </Button>
                </div>
              </div>
            )}

            <div className="w-full h-screen overflow-y-scroll pt-10 sm:pt-12 pb-12 sm:pb-16">
              <div className="flex flex-col items-center w-full max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-4xl mx-auto p-2 sm:p-3 md:p-4">
                {errorMessage ? (
                  <div className="flex flex-col items-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                      გამოცდა
                    </h1>
                    <p className="text-base sm:text-lg text-red-300 mb-4 sm:mb-6">
                      {errorMessage}
                    </p>
                    <Button
                      variant="default"
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 text-sm sm:text-base"
                      onClick={handleCloseExam}
                    >
                      დახურვა
                    </Button>
                  </div>
                ) : allQuestions.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                      გამოცდა
                    </h1>
                    <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">
                      კითხვები არ არის ხელმისაწვდომი. გთხოვთ, აირჩიოთ
                      კატეგორიები.
                    </p>
                    <Button
                      variant="default"
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 text-sm sm:text-base"
                      onClick={handleCloseExam}
                    >
                      დახურვა
                    </Button>
                  </div>
                ) : currentQuestion && shuffledOptions.length > 0 ? (
                  <div className="flex flex-col items-center w-full">
                    {currentQuestion.image && (
                      <div className="mb-4 sm:mb-6 mt-2">
                        <Image
                          src={currentQuestion.image}
                          alt="კითხვის სურათი"
                          width={
                            currentQuestion.image ===
                            "https://www.starti.ge/exam/shss.png"
                              ? 150
                              : 800
                          }
                          height={
                            currentQuestion.image ===
                            "https://www.starti.ge/exam/shss.png"
                              ? 75
                              : 300
                          }
                          className={clsx(
                            "border-none object-contain w-full",
                            currentQuestion.image ===
                              "https://www.starti.ge/exam/shss.png"
                              ? "max-w-[150px] h-[150px] sm:max-w-[200px] sm:h-[200px] mx-auto"
                              : "max-w-[400px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1200px] h-[200px] sm:h-[300px] md:h-[500px]"
                          )}
                          unoptimized
                        />
                      </div>
                    )}

                    <p className="text-base sm:text-lg md:text-lg text-white mb-4 sm:mb-6 text-center">
                      {currentQuestion.text}
                    </p>

                    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-full mb-4 sm:mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                        {shuffledOptions.map((option, index) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrectAnswer =
                            option === currentQuestion.correctAnswer;
                          const showCorrectAnswer =
                            answerSubmitted &&
                            !isAnswerCorrect &&
                            isCorrectAnswer;
                          const buttonBaseClass = showCorrectAnswer
                            ? "bg-green-500 cursor-default border border-gray-500"
                            : isSelected && answerSubmitted
                            ? isAnswerCorrect
                              ? "bg-green-500 cursor-default border border-gray-500"
                              : "bg-red-500 cursor-default border border-gray-500"
                            : isSelected
                            ? "bg-gray-400 cursor-pointer border border-gray-500"
                            : "bg-gray-300 border border-gray-500 hover:bg-gray-100";
                          const textColorClass =
                            (isSelected &&
                              answerSubmitted &&
                              !isAnswerCorrect) ||
                            showCorrectAnswer
                              ? "text-white"
                              : isSelected && answerSubmitted && isAnswerCorrect
                              ? "text-white"
                              : "text-black";
                          return (
                            <Button
                              key={index}
                              disabled={answerSubmitted}
                              className={`w-full p-3 sm:p-4 rounded-md text-left h-auto min-h-[60px] sm:min-h-[80px] flex items-center justify-start text-wrap break-words ${buttonBaseClass} transition-colors duration-300 touch-action-manipulation`}
                              onClick={() => handleAnswerClick(option)}
                              onTouchEnd={() =>
                                !answerSubmitted && handleAnswerClick(option)
                              }
                            >
                              <span className="mr-1 sm:mr-2 bg-gray-500 border border-gray-700 text-white rounded-md w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-base">
                                {index + 1}
                              </span>
                              <span
                                className={`flex-1 text-sm sm:text-base ${textColorClass}`}
                              >
                                {option}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                      გამოცდა
                    </h1>
                    <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">
                      კითხვები ამოიწურა!
                    </p>
                    <Button
                      variant="default"
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 text-sm sm:text-base"
                      onClick={handleCloseExam}
                    >
                      დახურვა
                    </Button>
                  </div>
                )}
              </div>
              <div className="pb-16 sm:pb-[75px] md:pb-20 z-40 text-white fixed bottom-1 right-[26px] sm:right-[34.5px] md:right-[37.5px] flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="border-green-500 accent-yellow-500 focus:ring-green-500 w-5 h-5 sm:w-5 sm:h-5"
                />
                <span className="hidden sm:hidden md:hidden lg:inline-flex text-sm">
                  ავტომატურად გადასვლა
                </span>
              </div>
            </div>
            {allQuestions.length > 0 && (
              <div className="fixed bottom-0 left-0 w-full bg-gray-900 p-2 sm:p-3 md:p-4 z-50">
                <div className="flex items-center justify-between w-full px-2 mx-auto">
                  <Button
                    variant="ghost"
                    className={`text-gray-600 hover:bg-gray-800 p-1 sm:p-4 rounded-md bg-gray-700 px-3 ring-1 ring-gray-400 touch-action-manipulation ${
                      currentQuestionIndex === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handlePreviousQuestion}
                    onTouchEnd={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronsLeft className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-yellow-400 rounded-sm" />
                  </Button>

                  <div className="flex justify-center space-x-1.5 sm:space-x-2">
                    {Array.from({
                      length: currentQuestion
                        ? currentQuestion.options.length
                        : 0,
                    }).map((_, index) => {
                      const option = shuffledOptions[index];
                      const isSelected = selectedAnswer === option;
                      return (
                        <Button
                          key={index}
                          disabled={answerSubmitted}
                          className={`text-black w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 rounded-md flex items-center justify-center text-base sm:text-lg md:text-xl z-60 touch-action-manipulation ${
                            isSelected
                              ? isAnswerCorrect
                                ? "bg-green-500 cursor-default"
                                : "bg-red-500 cursor-default"
                              : "bg-gray-300 hover:bg-gray-100"
                          } transition-colors duration-300`}
                          onClick={() => handleAnswerClick(option)}
                          onTouchEnd={() =>
                            !answerSubmitted && handleAnswerClick(option)
                          }
                        >
                          {index + 1}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    className={`text-gray-600 hover:bg-gray-800 p-1 sm:p-4 rounded-md bg-gray-700 px-3 ring-1 ring-gray-400 int touch-action-manipulation ${
                      !answerSubmitted ||
                      currentQuestionIndex === allQuestions.length - 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handleNextQuestion}
                    onTouchEnd={handleNextQuestion}
                    disabled={
                      !answerSubmitted ||
                      currentQuestionIndex === allQuestions.length - 1
                    }
                  >
                    <ChevronsRight className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-yellow-400 rounded-sm" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamPage;
