"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Calendar, ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/lib/types";

interface NewsArticleModalProps {
  articles: NewsArticle[];
}

export function NewsArticleModal({ articles }: NewsArticleModalProps) {
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  return (
    <div>
      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div
            key={article.id}
            className="amazon-card bg-white rounded-lg border border-[#e7e7e7] overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
          >
            <div>
              {/* Photo */}
              <div
                onClick={() => setActiveArticle(article)}
                className="relative aspect-[16/9] w-full overflow-hidden bg-[#131921] cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#131921]/90 text-[#febd69] font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs">
                  {article.category}
                </span>
              </div>

              {/* Text content */}
              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[#565959]">
                  <Calendar className="w-3.5 h-3.5 text-[#febd69]" />
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>3 min read</span>
                </div>

                <h3
                  onClick={() => setActiveArticle(article)}
                  className="font-bold text-sm sm:text-base text-[#0f1111] hover:text-[#c7511f] line-clamp-2 leading-snug cursor-pointer"
                >
                  {article.title}
                </h3>

                <p className="text-xs text-[#565959] line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            {/* Read button */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-[#f0f0f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveArticle(article)}
                className="text-xs font-bold text-[#007185] hover:text-[#c7511f] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <Link
                href="/home"
                className="text-[11px] text-[#565959] hover:text-[#0f1111]"
              >
                Find Parts →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-[#d5d9d9] my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="relative h-64 sm:h-80 w-full bg-[#131921]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeArticle.image_url}
                alt={activeArticle.title}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131921] via-[#131921]/40 to-transparent" />

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2.5 py-0.5 rounded bg-[#febd69] text-[#111111] font-bold text-[11px] uppercase tracking-wider mb-2 inline-block">
                  {activeArticle.category}
                </span>
                <h2 className="text-lg sm:text-2xl font-black leading-tight text-white drop-shadow">
                  {activeArticle.title}
                </h2>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-[#cccccc]">
                  <span>Published {new Date(activeArticle.published_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Mauritius Automotive Regulatory Desk</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs sm:text-sm text-[#0f1111] leading-relaxed">
              <div className="p-3.5 rounded-lg bg-[#fff8e7] border border-[#fbd88e] text-xs text-[#855b00]">
                <strong>Executive Summary:</strong> {activeArticle.summary}
              </div>

              <div className="whitespace-pre-line space-y-3 font-normal text-[#333333]">
                {activeArticle.content}
              </div>

              {/* Related CTA */}
              <div className="p-4 rounded-lg bg-[#f0f2f2] border border-[#d5d9d9] flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <div>
                  <h4 className="font-bold text-xs text-[#0f1111]">
                    Need compatible parts or advice for this vehicle?
                  </h4>
                  <p className="text-[11px] text-[#565959]">
                    Our authorized dealership staff can verify genuine fitment and warranty compliance.
                  </p>
                </div>
                <Link
                  href="/home"
                  className="px-5 py-2 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] whitespace-nowrap shadow-xs hover:shadow"
                >
                  Browse Parts Catalog
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#fcfcfc] border-t border-[#e7e7e7] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-1.5 rounded-md bg-[#f0f2f2] hover:bg-[#e3e6e6] text-xs font-semibold text-[#0f1111] border border-[#d5d9d9] cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
